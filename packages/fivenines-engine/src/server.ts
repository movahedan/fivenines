import { units } from "@packages/shared/units";

import { CAPACITY_POLICY } from "./catalog/capacity-policy";
import {
	BASE_LATENCY_MS,
	LATENCY_MS_PER_UTIL_PERCENT,
	SERVER_CATALOG,
	type ServerCatalogId,
} from "./catalog/kernel";
import { type RegionId, regions } from "./catalog/regions";
import type { ProjectCategory } from "./project";

export interface ServerInitial {
	id: string;
	catalogId: ServerCatalogId;
	region: RegionId;
}

export interface DemandSlice {
	category: ProjectCategory;
	requests: number;
	sourceRegion: RegionId;
	remote: boolean;
}

export interface ServerTickMetrics {
	assignedRequests: number;
	handledRequests: number;
	droppedRequests: number;
	cpuLoad: number;
	netLoad: number;
	memOcc: number;
	p95LatencyMs: number;
	utilization: number;
	errorPpm: number;
}

interface AxisLoad {
	load: number;
	cap: number;
}

const EMPTY_METRICS: ServerTickMetrics = {
	assignedRequests: 0,
	handledRequests: 0,
	droppedRequests: 0,
	cpuLoad: 0,
	netLoad: 0,
	memOcc: 0,
	p95LatencyMs: BASE_LATENCY_MS,
	utilization: 0,
	errorPpm: 0,
};

function categoryCost(
	category: ProjectCategory,
): (typeof CAPACITY_POLICY.categories)[ProjectCategory] {
	return CAPACITY_POLICY.categories[category];
}

function assignedFromSlices(slices: readonly DemandSlice[]): number {
	return slices.reduce((sum, slice) => sum + slice.requests, 0);
}

function cpuLoadFromSlices(slices: readonly DemandSlice[]): number {
	return slices.reduce(
		(sum, slice) => sum + slice.requests * categoryCost(slice.category).cpuPerRequest,
		0,
	);
}

function netLoadFromSlices(slices: readonly DemandSlice[]): number {
	return slices.reduce(
		(sum, slice) => sum + slice.requests * categoryCost(slice.category).bytesPerRequest,
		0,
	);
}

function memOccFromSlices(
	slices: readonly DemandSlice[],
	assignedRequests: number,
	baseMemoryMiB: number,
): number {
	if (assignedRequests === 0) {
		return baseMemoryMiB;
	}

	const inFlight = Math.max(
		0,
		Math.floor((assignedRequests * CAPACITY_POLICY.inflightPerThousandRequests) / 1000),
	);
	const weightedMem = slices.reduce(
		(sum, slice) => sum + slice.requests * categoryCost(slice.category).memPerInflight,
		0,
	);

	return baseMemoryMiB + Math.floor((inFlight * weightedMem) / assignedRequests);
}

function handledFromFitRatios(assignedRequests: number, axes: readonly AxisLoad[]): number {
	let handled = assignedRequests;

	for (const axis of axes) {
		if (axis.load === 0) {
			continue;
		}

		handled = Math.min(handled, Math.floor((assignedRequests * axis.cap) / axis.load));
	}

	return handled;
}

function tightestUtilization(axes: readonly AxisLoad[]): number {
	let utilization = 0;

	for (const axis of axes) {
		utilization = Math.max(utilization, units.ratioPercent(axis.load, axis.cap));
	}

	return utilization;
}

function remoteExtraMsFromSlices(
	slices: readonly DemandSlice[],
	serverRegion: RegionId,
	assignedRequests: number,
): number {
	if (assignedRequests === 0) {
		return 0;
	}

	const extraMs = slices.reduce(
		(sum, slice) =>
			sum + slice.requests * regions.remoteLatencyMs(slice.sourceRegion, serverRegion),
		0,
	);

	return Math.floor(extraMs / assignedRequests);
}

export class Server {
	readonly id: string;
	readonly kind = "server" as const;
	readonly catalogId: ServerCatalogId;
	readonly region: RegionId;
	readonly computeUnitsPerHour: number;
	readonly networkBytesPerHour: number;
	readonly memoryMiB: number;
	readonly baseMemoryMiB: number;

	#slices: DemandSlice[] = [];
	#metrics: ServerTickMetrics = EMPTY_METRICS;

	constructor(initial: ServerInitial) {
		const spec = SERVER_CATALOG[initial.catalogId];

		this.id = initial.id;
		this.catalogId = initial.catalogId;
		this.region = regions.parseRegionId(initial.region);
		this.computeUnitsPerHour = units.asNonNegativeInteger(
			spec.computeUnitsPerHour,
			"computeUnitsPerHour",
		);
		this.networkBytesPerHour = units.asNonNegativeInteger(
			spec.networkBytesPerHour,
			"networkBytesPerHour",
		);
		this.memoryMiB = units.asNonNegativeInteger(spec.memoryMiB, "memoryMiB");
		this.baseMemoryMiB = units.asNonNegativeInteger(spec.baseMemoryMiB, "baseMemoryMiB");
	}

	get metrics(): ServerTickMetrics {
		return this.#metrics;
	}

	get slices(): readonly DemandSlice[] {
		return this.#slices;
	}

	get remainingHeadroom(): number {
		return Math.max(0, this.computeUnitsPerHour - cpuLoadFromSlices(this.#slices));
	}

	resetDemand(): void {
		this.#slices = [];
	}

	assignSlice(slice: Omit<DemandSlice, "remote">): void {
		const requests = units.asNonNegativeInteger(slice.requests, "assignedRequests");

		if (requests === 0) {
			return;
		}

		this.#slices.push({
			category: slice.category,
			requests,
			sourceRegion: slice.sourceRegion,
			remote: slice.sourceRegion !== this.region,
		});
	}

	tick(): ServerTickMetrics {
		const assignedRequests = assignedFromSlices(this.#slices);
		const cpuLoad = cpuLoadFromSlices(this.#slices);
		const netLoad = netLoadFromSlices(this.#slices);
		const memOcc = memOccFromSlices(this.#slices, assignedRequests, this.baseMemoryMiB);
		const axes: readonly AxisLoad[] = [
			{ load: cpuLoad, cap: this.computeUnitsPerHour },
			{ load: netLoad, cap: this.networkBytesPerHour },
			{ load: memOcc, cap: this.memoryMiB },
		];
		const handledRequests =
			assignedRequests === 0 ? 0 : handledFromFitRatios(assignedRequests, axes);
		const droppedRequests = assignedRequests - handledRequests;
		const utilization = assignedRequests === 0 ? 0 : tightestUtilization(axes);
		const remoteExtraMs = remoteExtraMsFromSlices(this.#slices, this.region, assignedRequests);
		const p95LatencyMs =
			BASE_LATENCY_MS + utilization * LATENCY_MS_PER_UTIL_PERCENT + remoteExtraMs;
		const errorPpm =
			assignedRequests === 0 ? 0 : Math.floor((droppedRequests * 1_000_000) / assignedRequests);

		this.#metrics = {
			assignedRequests,
			handledRequests,
			droppedRequests,
			cpuLoad,
			netLoad,
			memOcc,
			p95LatencyMs,
			utilization,
			errorPpm,
		};

		return this.#metrics;
	}
}

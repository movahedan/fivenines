import { units } from "@packages/shared/units";

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
	p95LatencyMs: number;
	utilization: number;
	errorPpm: number;
}

const EMPTY_METRICS: ServerTickMetrics = {
	assignedRequests: 0,
	handledRequests: 0,
	droppedRequests: 0,
	p95LatencyMs: BASE_LATENCY_MS,
	utilization: 0,
	errorPpm: 0,
};

function assignedFromSlices(slices: readonly DemandSlice[]): number {
	return slices.reduce((sum, slice) => sum + slice.requests, 0);
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
	readonly cpuMillicores: number;
	readonly memoryMiB: number;
	readonly millicoresPerRequest: number;
	readonly requestCapacity: number;

	#slices: DemandSlice[] = [];
	#metrics: ServerTickMetrics = EMPTY_METRICS;

	constructor(initial: ServerInitial) {
		const spec = SERVER_CATALOG[initial.catalogId];

		this.id = initial.id;
		this.catalogId = initial.catalogId;
		this.region = regions.parseRegionId(initial.region);
		this.cpuMillicores = units.asNonNegativeInteger(spec.cpuMillicores, "cpuMillicores");
		this.memoryMiB = units.asNonNegativeInteger(spec.memoryMiB, "memoryMiB");
		this.millicoresPerRequest = units.asNonNegativeInteger(
			spec.millicoresPerRequest,
			"millicoresPerRequest",
		);
		this.requestCapacity =
			this.millicoresPerRequest === 0
				? 0
				: Math.floor(this.cpuMillicores / this.millicoresPerRequest);
	}

	get metrics(): ServerTickMetrics {
		return this.#metrics;
	}

	get slices(): readonly DemandSlice[] {
		return this.#slices;
	}

	get remainingHeadroom(): number {
		return Math.max(0, this.requestCapacity - assignedFromSlices(this.#slices));
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
		const handledRequests = Math.min(assignedRequests, this.requestCapacity);
		const droppedRequests = assignedRequests - handledRequests;
		const utilization = units.ratioPercent(assignedRequests, this.requestCapacity);
		const remoteExtraMs = remoteExtraMsFromSlices(this.#slices, this.region, assignedRequests);
		const p95LatencyMs =
			BASE_LATENCY_MS + utilization * LATENCY_MS_PER_UTIL_PERCENT + remoteExtraMs;
		const errorPpm =
			assignedRequests === 0 ? 0 : Math.floor((droppedRequests * 1_000_000) / assignedRequests);

		this.#metrics = {
			assignedRequests,
			handledRequests,
			droppedRequests,
			p95LatencyMs,
			utilization,
			errorPpm,
		};

		return this.#metrics;
	}
}

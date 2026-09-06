import { units } from "@packages/shared/units";

import { CAPACITY_POLICY } from "./catalog/capacity-policy";
import { BASE_LATENCY_MS, LATENCY_MS_PER_UTIL_PERCENT } from "./catalog/kernel";
import { type RegionId, regions } from "./catalog/regions";
import type { ProjectCategory } from "./project";

export interface ServerDemandSlice {
	category: ProjectCategory;
	requests: number;
	sourceRegion: RegionId;
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

export interface ServerTickStocks {
	computeUnitsPerHour: number;
	networkBytesPerHour: number;
	memoryMiB: number;
	baseMemoryMiB: number;
	region: RegionId;
}

interface AxisLoad {
	load: number;
	cap: number;
}

export const EMPTY_SERVER_TICK_METRICS: ServerTickMetrics = {
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

export function cpuLoadFromSlices(slices: readonly ServerDemandSlice[]): number {
	return slices.reduce(
		(sum, slice) => sum + slice.requests * categoryCost(slice.category).cpuPerRequest,
		0,
	);
}

function assignedFromSlices(slices: readonly ServerDemandSlice[]): number {
	return slices.reduce((sum, slice) => sum + slice.requests, 0);
}

function netLoadFromSlices(slices: readonly ServerDemandSlice[]): number {
	return slices.reduce(
		(sum, slice) => sum + slice.requests * categoryCost(slice.category).bytesPerRequest,
		0,
	);
}

function memOccFromSlices(
	slices: readonly ServerDemandSlice[],
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
	slices: readonly ServerDemandSlice[],
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

export function measureServerTick(
	slices: readonly ServerDemandSlice[],
	stocks: ServerTickStocks,
): ServerTickMetrics {
	const assignedRequests = assignedFromSlices(slices);
	const cpuLoad = cpuLoadFromSlices(slices);
	const netLoad = netLoadFromSlices(slices);
	const memOcc = memOccFromSlices(slices, assignedRequests, stocks.baseMemoryMiB);
	const axes: readonly AxisLoad[] = [
		{ load: cpuLoad, cap: stocks.computeUnitsPerHour },
		{ load: netLoad, cap: stocks.networkBytesPerHour },
		{ load: memOcc, cap: stocks.memoryMiB },
	];
	const handledRequests = assignedRequests === 0 ? 0 : handledFromFitRatios(assignedRequests, axes);
	const droppedRequests = assignedRequests - handledRequests;
	const utilization = assignedRequests === 0 ? 0 : tightestUtilization(axes);
	const remoteExtraMs = remoteExtraMsFromSlices(slices, stocks.region, assignedRequests);
	const errorPpm =
		assignedRequests === 0 ? 0 : Math.floor((droppedRequests * 1_000_000) / assignedRequests);

	return {
		assignedRequests,
		handledRequests,
		droppedRequests,
		cpuLoad,
		netLoad,
		memOcc,
		p95LatencyMs: BASE_LATENCY_MS + utilization * LATENCY_MS_PER_UTIL_PERCENT + remoteExtraMs,
		utilization,
		errorPpm,
	};
}

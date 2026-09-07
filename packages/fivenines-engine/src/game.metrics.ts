import { units } from "@packages/shared/units";

import type { ServerTickMetrics } from "./server.metrics";

export interface GameTickMetrics {
	handledRequests: number;
	droppedRequests: number;
	p95LatencyMs: number;
	utilization: number;
	errorPpm: number;
}

export const EMPTY_GAME_TICK_METRICS: GameTickMetrics = {
	handledRequests: 0,
	droppedRequests: 0,
	p95LatencyMs: 0,
	utilization: 0,
	errorPpm: 0,
};

export function measureGameTick(
	serverMetrics: readonly ServerTickMetrics[],
	demandRequests: number,
	unroutableDemand: number,
): GameTickMetrics {
	if (serverMetrics.length === 0) {
		return {
			handledRequests: 0,
			droppedRequests: unroutableDemand,
			p95LatencyMs: 0,
			utilization: 0,
			errorPpm: units.partsPerMillion(unroutableDemand, demandRequests),
		};
	}

	let handledRequests = 0;
	let droppedRequests = unroutableDemand;
	let p95LatencyMs = 0;
	let utilization = 0;

	for (const snapshot of serverMetrics) {
		handledRequests += snapshot.handledRequests;
		droppedRequests += snapshot.droppedRequests;
		p95LatencyMs = Math.max(p95LatencyMs, snapshot.p95LatencyMs);
		utilization = Math.max(utilization, snapshot.utilization);
	}

	return {
		handledRequests,
		droppedRequests,
		p95LatencyMs,
		utilization,
		errorPpm: units.partsPerMillion(droppedRequests, demandRequests),
	};
}

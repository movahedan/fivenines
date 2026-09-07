import { units } from "@packages/shared/units";

export interface ProjectTickMetrics {
	emittedRequests: number;
}

export const EMPTY_PROJECT_TICK_METRICS: ProjectTickMetrics = {
	emittedRequests: 0,
};

export function measureProjectTick(emittedRequests: number): ProjectTickMetrics {
	return {
		emittedRequests: units.asNonNegativeInteger(emittedRequests, "emittedRequests"),
	};
}

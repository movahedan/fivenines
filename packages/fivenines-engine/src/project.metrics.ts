import { units } from "@packages/shared/units";

import { slaAvailabilityPpm } from "./catalog/sla-policy";

export interface SlaHourSample {
	handled: number;
	emitted: number;
}

export interface ProjectSlaHour {
	emittedRequests: number;
	assignedRequests: number;
	unroutableRequests: number;
	capacityDropRequests: number;
	handledRequests: number;
}

export interface ProjectTickMetrics {
	emittedRequests: number;
	handledRequests: number;
	unroutableRequests: number;
	capacityDropRequests: number;
	availabilityPpm: number | null;
	windowAvailabilityPpm: number | null;
}

export const EMPTY_PROJECT_TICK_METRICS: ProjectTickMetrics = {
	emittedRequests: 0,
	handledRequests: 0,
	unroutableRequests: 0,
	capacityDropRequests: 0,
	availabilityPpm: null,
	windowAvailabilityPpm: null,
};

export function measureProjectTick(emittedRequests: number): ProjectTickMetrics {
	return {
		...EMPTY_PROJECT_TICK_METRICS,
		emittedRequests: units.asNonNegativeInteger(emittedRequests, "emittedRequests"),
	};
}

export function windowAvailabilityPpm(samples: readonly SlaHourSample[]): number | null {
	let handled = 0;
	let emitted = 0;

	for (const sample of samples) {
		handled += sample.handled;
		emitted += sample.emitted;
	}

	return slaAvailabilityPpm(handled, emitted);
}

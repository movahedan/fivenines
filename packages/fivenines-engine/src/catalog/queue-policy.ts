import type { DemandWaitPolicy } from "./demand-types";

export const QUEUE_POLICY = {
	interactiveMaxCarryTicks: 0,
	continuousMaxCarryTicks: 0,
	queuedMaxCarryTicks: 2,
	jobMaxCarryTicks: null,
	automaticRetries: 0,
} as const;

export function maxCarryTicks(waitPolicy: DemandWaitPolicy): number | null {
	switch (waitPolicy) {
		case "interactive":
			return QUEUE_POLICY.interactiveMaxCarryTicks;
		case "continuous":
			return QUEUE_POLICY.continuousMaxCarryTicks;
		case "queued":
			return QUEUE_POLICY.queuedMaxCarryTicks;
		case "job":
			return QUEUE_POLICY.jobMaxCarryTicks;
	}
}

export function isDurableWaitPolicy(waitPolicy: DemandWaitPolicy): boolean {
	return waitPolicy === "job";
}

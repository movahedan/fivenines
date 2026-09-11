import { describe, expect, it } from "bun:test";

import { categoryPathHour, demandTypePathHour, mergePathHours } from "./execute";
import type { WorkSettlement } from "./share";

describe("work - path hour execution", () => {
	it("does not retry interactive leftovers; they fail in the arrival hour", () => {
		const summary = demandTypePathHour(
			"page-read",
			"interactive",
			10,
			settlements("app", 4, 0, 6, 0),
		);

		expect(summary).toEqual({
			success: 0,
			fail: 10,
			pending: 0,
			estimatedLatency: 3,
		});
	});

	it("keeps queued leftover pending without a second inner tick", () => {
		const summary = demandTypePathHour(
			"email-message",
			"queued",
			8,
			settlements("worker", 3, 5, 0, 0),
		);

		expect(summary.pending).toBe(8);
		expect(summary.success).toBe(0);
		expect(summary.fail).toBe(0);
	});

	it("fails GPU inference when the worker settlement is infeasible", () => {
		const summary = demandTypePathHour(
			"inference-gpu",
			"interactive",
			4,
			settlements("worker", 0, 0, 0, 4),
		);

		expect(summary.fail).toBe(4);
		expect(summary.success).toBe(0);
	});

	it("attributes category teaching traffic as success plus fail with no pending", () => {
		expect(categoryPathHour(500, 700)).toEqual({
			success: 500,
			fail: 200,
			pending: 0,
			estimatedLatency: 1,
		});
	});

	it("merges independent demand-type hours without double-counting latency as a sum", () => {
		const merged = mergePathHours(categoryPathHour(1, 1), {
			success: 2,
			fail: 0,
			pending: 0,
			estimatedLatency: 3,
		});

		expect(merged.success).toBe(3);
		expect(merged.estimatedLatency).toBe(3);
	});
});

function settlements(
	nodeId: string,
	handled: number,
	waiting: number,
	rejected: number,
	infeasible: number,
): Map<string, WorkSettlement[]> {
	return new Map([
		[
			nodeId,
			[
				{
					itemId: nodeId,
					projectId: "alpha",
					handled,
					waiting,
					rejected,
					infeasible,
				},
			],
		],
	]);
}

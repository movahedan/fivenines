import { describe, expect, it } from "bun:test";

import { DEMAND_TYPES, type DemandTypeId } from "./catalog/demand-types";
import { oneBronzeInitial } from "./fixtures";
import { Game } from "./game";
import { FixedRandomSource } from "./traffic/random-source";
import { compileDemandGraph } from "./work/compile";

const DEMAND_TYPE_IDS = Object.keys(DEMAND_TYPES) as DemandTypeId[];

describe("Game - integrated runtime projections", () => {
	it("compiles each demand type to a small static graph without per-request nodes", () => {
		for (const demandTypeId of DEMAND_TYPE_IDS) {
			const first = compileDemandGraph(demandTypeId);
			const second = compileDemandGraph(demandTypeId);

			expect(first.graph.nodes.length).toBeLessThanOrEqual(8);
			expect(first.nodeWork.length).toBeLessThanOrEqual(8);
			expect(first.graph.nodes.map((node) => node.id)).toEqual(
				second.graph.nodes.map((node) => node.id),
			);
			expect(first.nodeWork.map((row) => `${row.nodeId}:${row.dimension}`)).toEqual(
				second.nodeWork.map((row) => `${row.nodeId}:${row.dimension}`),
			);
		}
	});

	it("keeps seeded contention conserved when project order is permuted", () => {
		const forward = new Game(oneBronzeInitial, { random: new FixedRandomSource(0.37) });
		const reversed: typeof oneBronzeInitial = {
			...oneBronzeInitial,
			customers: [
				{
					id: "customer-1",
					projects: [...(oneBronzeInitial.customers[0]?.projects ?? [])].reverse(),
				},
			],
		};
		const backward = new Game(reversed, { random: new FixedRandomSource(0.37) });

		for (let hour = 0; hour < 24; hour += 1) {
			forward.tick();
			backward.tick();
		}

		expect(forward.metrics.handledRequests + forward.metrics.droppedRequests).toBe(1400);
		expect(backward.metrics.handledRequests + backward.metrics.droppedRequests).toBe(1400);
		expect(forward.metrics.handledRequests).toBe(backward.metrics.handledRequests);
		expect(forward.pathHour.success).toBe(forward.metrics.handledRequests);
		expect(forward.pathHour.fail).toBe(forward.metrics.droppedRequests);
		expect(forward.servers[0]?.metrics.diskLoad).toBeGreaterThan(0);
	});
});

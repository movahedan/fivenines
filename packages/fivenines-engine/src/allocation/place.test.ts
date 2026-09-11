import { describe, expect, it } from "bun:test";

import { BRONZE } from "../catalog/kernel";
import { oneBronzeInitial, twoBronzeInitial } from "../fixtures";
import { Game } from "../game";
import { Server } from "../server";
import { settleHostTick } from "../work/share";

describe("Game - resource allocator", () => {
	it("splits contended Bronze CPU equally instead of by project iteration order", () => {
		const forward = new Game(oneBronzeInitial).tick();
		const reversed: typeof oneBronzeInitial = {
			...oneBronzeInitial,
			customers: [
				{
					id: "customer-1",
					projects: [...(oneBronzeInitial.customers[0]?.projects ?? [])].reverse(),
				},
			],
		};
		const backward = new Game(reversed).tick();

		expect(forward.metrics.handledRequests).toBe(1000);
		expect(forward.metrics.droppedRequests).toBe(400);
		expect(forward.servers[0]?.metrics.assignedRequests).toBe(1000);
		expect(forward.servers[0]?.metrics.cpuLoad).toBe(1000);

		const handled = Object.fromEntries(
			forward.customers[0]?.projects.map((project) => [
				project.id,
				project.metrics.handledRequests,
			]) ?? [],
		);

		expect(handled["project-1"]).toBe(500);
		expect(handled["project-2"]).toBe(500);
		expect(backward.customers[0]?.projects[0]?.metrics.handledRequests).toBe(500);
		expect(backward.customers[0]?.projects[1]?.metrics.handledRequests).toBe(500);
	});

	it("does not spill overload onto a second Bronze", () => {
		const healthy = new Game(twoBronzeInitial).tick();

		expect(healthy.metrics.droppedRequests).toBe(0);
		expect(healthy.servers[0]?.metrics.assignedRequests).toBe(700);
		expect(healthy.servers[1]?.metrics.assignedRequests).toBe(700);
	});

	it("marks GPU work infeasible on Bronze instead of spending CPU", () => {
		const server = new Server({ id: "server-1", catalogId: "bronze", region: "utc+0" });
		const settlements = settleHostTick(server.hostBudget(), [
			{
				id: "train",
				projectId: "alpha",
				arrivalTick: 0,
				dimension: "gpuWork",
				amount: 80,
				gpuWork: 80,
				gpuMemoryMiB: 4096,
				waitPolicy: "job",
			},
		]);

		expect(server.gpuCount).toBe(0);
		expect(BRONZE.diskOps).toBeGreaterThan(0);
		expect(settlements[0]?.infeasible).toBe(80);
		expect(settlements[0]?.handled).toBe(0);
	});
});

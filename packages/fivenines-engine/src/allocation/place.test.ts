import { describe, expect, it } from "bun:test";

import { PAYG_ONLY_COMMERCIAL_STUB } from "../catalog/commercial-policy";
import { BRONZE } from "../catalog/kernel";
import { oneBronzeInitial, twoBronzeInitial } from "../fixtures";
import { Game } from "../game";
import { Server } from "../server";
import { FixedRandomSource } from "../traffic/random-source";
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

	it("records compiled path outcomes on the same Game.tick as allocation", () => {
		const game = new Game(oneBronzeInitial).tick();

		expect(game.pathHour.success + game.pathHour.fail + game.pathHour.pending).toBe(1400);
		expect(game.pathHour.pending).toBe(0);
		expect(game.pathHour.success).toBe(game.metrics.handledRequests);
		expect(game.pathHour.fail).toBe(game.metrics.droppedRequests);
	});

	it("executes acquaintance page-read and record-write graphs without a second inner tick", () => {
		const game = new Game(
			{
				customers: [
					{
						id: "customer-1",
						projects: [
							{
								id: "shaped-1",
								estimatedRequestsPerHour: 120,
								status: "served",
								demand: "shaped",
								category: "saas",
								region: "utc+0",
								campaignProne: false,
								commercial: PAYG_ONLY_COMMERCIAL_STUB,
								route: { kind: "server", serverId: "server-1" },
							},
						],
					},
				],
				assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			},
			{ random: new FixedRandomSource(0.5) },
		).tick();

		expect(game.pathHour.success + game.pathHour.fail + game.pathHour.pending).toBe(
			game.metrics.handledRequests + game.metrics.droppedRequests,
		);
		expect(game.pathHour.estimatedLatency).toBeGreaterThan(0);
		expect(game.hourIndex).toBe(1);
	});
});

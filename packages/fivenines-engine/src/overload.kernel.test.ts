import { describe, expect, it } from "bun:test";

import { constantProject } from "./fixtures";
import type { GameInitial, RegionId } from "./index";
import { Game, oneBronzeInitial, openingInitial, twoBronzeInitial } from "./index";

const offeredConstantInitial: GameInitial = {
	customers: [
		{
			id: "customer-1",
			projects: [constantProject("project-1", 700, "offered")],
		},
	],
	assets: [],
};

describe("Game - tick", () => {
	it("drops requests on one Bronze and clears drops with lower p95 on two Bronze when both projects are served", () => {
		const overloaded = new Game(oneBronzeInitial).tick();
		const healthy = new Game(twoBronzeInitial).tick();

		expect(overloaded.metrics.droppedRequests).toBeGreaterThan(0);
		expect(healthy.metrics.droppedRequests).toBe(0);
		expect(healthy.metrics.p95LatencyMs).toBeLessThan(overloaded.metrics.p95LatencyMs);
	});

	it("leaves demand at 1400 when extra offered and declined projects carry estimates", () => {
		const customer = oneBronzeInitial.customers[0];

		if (customer === undefined) {
			throw new Error("oneBronzeInitial must include a customer");
		}

		const withIdleProjects: GameInitial = {
			...oneBronzeInitial,
			customers: [
				{
					...customer,
					projects: [
						...customer.projects,
						constantProject("project-offered", 5000, "offered"),
						constantProject("project-declined", 5000, "declined"),
					],
				},
			],
		};

		const baseline = new Game(oneBronzeInitial).tick();
		const isolated = new Game(withIdleProjects).tick();

		expect(isolated.metrics.handledRequests + isolated.metrics.droppedRequests).toBe(1400);
		expect(isolated.metrics.droppedRequests).toBe(baseline.metrics.droppedRequests);
	});

	it("produces no demand when openingInitial projects stay offered and the fleet is empty", () => {
		const game = new Game(openingInitial).tick();

		expect(openingInitial.customers).toHaveLength(4);
		const projectCount = openingInitial.customers.flatMap((customer) => customer.projects).length;

		expect(projectCount).toBeGreaterThanOrEqual(10);
		expect(openingInitial.assets).toHaveLength(0);
		expect(game.metrics.handledRequests).toBe(0);
		expect(game.metrics.droppedRequests).toBe(0);
	});
});

describe("Game - hourIndex", () => {
	it("starts at 0 and becomes 1 after tick", () => {
		const game = new Game(oneBronzeInitial);

		expect(game.hourIndex).toBe(0);

		game.tick();

		expect(game.hourIndex).toBe(1);
	});

	it("does not change hour when acceptProject is dispatched", () => {
		const game = new Game(offeredConstantInitial);

		expect(game.hourIndex).toBe(0);

		game.dispatch({ type: "acceptProject", payload: { projectId: "project-1" } });

		expect(game.hourIndex).toBe(0);
	});
});

describe("Game - construct", () => {
	it("throws when customer ids are duplicated", () => {
		const customer = oneBronzeInitial.customers[0];

		if (customer === undefined) {
			throw new Error("oneBronzeInitial must include a customer");
		}

		expect(
			() =>
				new Game({
					...oneBronzeInitial,
					customers: [
						customer,
						{
							id: customer.id,
							projects: [constantProject("project-other", 0, "offered")],
						},
					],
				}),
		).toThrow();
	});

	it("throws when project ids are duplicated", () => {
		const customer = oneBronzeInitial.customers[0];

		if (customer === undefined) {
			throw new Error("oneBronzeInitial must include a customer");
		}

		expect(
			() =>
				new Game({
					...oneBronzeInitial,
					customers: [
						customer,
						{
							id: "customer-2",
							projects: [constantProject("project-1", 0, "offered")],
						},
					],
				}),
		).toThrow();
	});

	it("throws when asset ids are duplicated", () => {
		expect(
			() =>
				new Game({
					...oneBronzeInitial,
					assets: [
						{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" },
						{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" },
					],
				}),
		).toThrow();
	});

	it("throws when server region is unknown", () => {
		expect(
			() =>
				new Game({
					...oneBronzeInitial,
					assets: [
						{
							kind: "server",
							id: "server-1",
							catalogId: "bronze",
							region: "utc+3" as unknown as RegionId,
						},
					],
				}),
		).toThrow("unknown region: utc+3");
	});
});

import { describe, expect, it } from "bun:test";

import type { GameInitial } from "./index";
import { Game, oneBronzeInitial, openingInitial, twoBronzeInitial } from "./index";

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
						{ id: "project-offered", estimatedRequestsPerHour: 5000, status: "offered" },
						{ id: "project-declined", estimatedRequestsPerHour: 5000, status: "declined" },
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
							projects: [{ id: "project-other", estimatedRequestsPerHour: 0, status: "offered" }],
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
							projects: [{ id: "project-1", estimatedRequestsPerHour: 0, status: "offered" }],
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
						{ kind: "server", id: "server-1", catalogId: "bronze" },
						{ kind: "server", id: "server-1", catalogId: "bronze" },
					],
				}),
		).toThrow();
	});
});

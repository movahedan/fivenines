import { describe, expect, it } from "bun:test";

import type { GameInitial } from "./index";
import { Game, oneTinyInitial, twoTinyInitial } from "./index";

describe("Game - tick", () => {
	it("drops requests on one Tiny and clears drops with lower p95 on two Tiny when both projects are served", () => {
		const overloaded = new Game(oneTinyInitial).tick();
		const healthy = new Game(twoTinyInitial).tick();

		expect(overloaded.metrics.droppedRequests).toBeGreaterThan(0);
		expect(healthy.metrics.droppedRequests).toBe(0);
		expect(healthy.metrics.p95LatencyMs).toBeLessThan(overloaded.metrics.p95LatencyMs);
	});

	it("leaves demand at 1400 when extra offered and declined projects carry estimates", () => {
		const customer = oneTinyInitial.customers[0];

		if (customer === undefined) {
			throw new Error("oneTinyInitial must include a customer");
		}

		const withIdleProjects: GameInitial = {
			...oneTinyInitial,
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

		const baseline = new Game(oneTinyInitial).tick();
		const isolated = new Game(withIdleProjects).tick();

		expect(isolated.metrics.handledRequests + isolated.metrics.droppedRequests).toBe(1400);
		expect(isolated.metrics.droppedRequests).toBe(baseline.metrics.droppedRequests);
	});
});

describe("Game - construct", () => {
	it("throws when customer ids are duplicated", () => {
		const customer = oneTinyInitial.customers[0];

		if (customer === undefined) {
			throw new Error("oneTinyInitial must include a customer");
		}

		expect(
			() =>
				new Game({
					...oneTinyInitial,
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
		const customer = oneTinyInitial.customers[0];

		if (customer === undefined) {
			throw new Error("oneTinyInitial must include a customer");
		}

		expect(
			() =>
				new Game({
					...oneTinyInitial,
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
					...oneTinyInitial,
					assets: [
						{ kind: "server", id: "server-1", catalogId: "tiny" },
						{ kind: "server", id: "server-1", catalogId: "tiny" },
					],
				}),
		).toThrow();
	});

	it("throws when a project route references an unknown project id", () => {
		expect(
			() =>
				new Game({
					...oneTinyInitial,
					assets: [...oneTinyInitial.assets, { kind: "loadBalancer", id: "lb-1" }],
					projectRoutes: [{ projectId: "missing-project", loadBalancerId: "lb-1" }],
				}),
		).toThrow();
	});

	it("throws when a project route references an unknown load balancer id", () => {
		expect(
			() =>
				new Game({
					...oneTinyInitial,
					projectRoutes: [{ projectId: "project-1", loadBalancerId: "missing-lb" }],
				}),
		).toThrow();
	});

	it("throws when a balancer pool references an unknown load balancer id", () => {
		expect(
			() =>
				new Game({
					...oneTinyInitial,
					balancerPools: [{ loadBalancerId: "missing-lb", serverId: "server-1" }],
				}),
		).toThrow();
	});

	it("throws when a balancer pool references an unknown server id", () => {
		expect(
			() =>
				new Game({
					...oneTinyInitial,
					assets: [...oneTinyInitial.assets, { kind: "loadBalancer", id: "lb-1" }],
					balancerPools: [{ loadBalancerId: "lb-1", serverId: "missing-server" }],
				}),
		).toThrow();
	});

	it("throws when a project is routed twice", () => {
		expect(
			() =>
				new Game({
					...oneTinyInitial,
					assets: [...oneTinyInitial.assets, { kind: "loadBalancer", id: "lb-1" }],
					projectRoutes: [
						{ projectId: "project-1", loadBalancerId: "lb-1" },
						{ projectId: "project-1", loadBalancerId: "lb-1" },
					],
				}),
		).toThrow();
	});

	it("throws when the same server is attached to two load balancers", () => {
		expect(
			() =>
				new Game({
					...oneTinyInitial,
					assets: [
						{ kind: "server", id: "server-1", catalogId: "tiny" },
						{ kind: "loadBalancer", id: "lb-1" },
						{ kind: "loadBalancer", id: "lb-2" },
					],
					balancerPools: [
						{ loadBalancerId: "lb-1", serverId: "server-1" },
						{ loadBalancerId: "lb-2", serverId: "server-1" },
					],
				}),
		).toThrow();
	});
});

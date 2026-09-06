import { describe, expect, it } from "bun:test";

import type { EngineCommand, GameInitial } from "./index";
import { Game, oneTinyInitial } from "./index";

function offeredInitial(serverCount: 0 | 1): GameInitial {
	return {
		customers: [
			{
				id: "customer-1",
				projects: [
					{ id: "project-1", estimatedRequestsPerHour: 700, status: "offered" },
					{ id: "project-2", estimatedRequestsPerHour: 700, status: "offered" },
				],
			},
		],
		assets: serverCount === 1 ? [{ kind: "server", id: "server-1", catalogId: "tiny" }] : [],
		projectRoutes: [],
		balancerPools: [],
	};
}

function acceptBothProjects(game: Game): Game {
	return game
		.dispatch({ type: "acceptProject", payload: { projectId: "project-1" } })
		.dispatch({ type: "acceptProject", payload: { projectId: "project-2" } });
}

describe("Game - dispatch", () => {
	it("drops requests on one Tiny and clears drops with lower p95 when offered projects are accepted and Tiny servers are bought", () => {
		const overloaded = acceptBothProjects(new Game(offeredInitial(1))).tick();

		const healthy = acceptBothProjects(new Game(offeredInitial(0)))
			.dispatch({ type: "buyServer", payload: { serverType: "tiny" } })
			.dispatch({ type: "buyServer", payload: { serverType: "tiny" } })
			.tick();

		expect(overloaded.metrics.droppedRequests).toBeGreaterThan(0);
		expect(healthy.metrics.droppedRequests).toBe(0);
		expect(healthy.metrics.p95LatencyMs).toBeLessThan(overloaded.metrics.p95LatencyMs);
	});

	it("throws when command type is unknown", () => {
		const game = new Game(offeredInitial(0));

		expect(() => game.dispatch({ type: "nope" } as unknown as EngineCommand)).toThrow();
	});

	it("leaves metrics empty until tick after accept and buy", () => {
		const game = acceptBothProjects(new Game(offeredInitial(1))).dispatch({
			type: "buyServer",
			payload: { serverType: "tiny" },
		});

		expect(game.metrics).toEqual({
			handledRequests: 0,
			droppedRequests: 0,
			p95LatencyMs: 0,
			utilization: 0,
			errorPpm: 0,
		});

		game.tick();

		expect(game.metrics.handledRequests + game.metrics.droppedRequests).toBe(1400);
	});

	it("throws when accepting an unknown project", () => {
		const game = new Game(offeredInitial(0));

		expect(() =>
			game.dispatch({ type: "acceptProject", payload: { projectId: "missing-project" } }),
		).toThrow();
	});

	it("throws when accepting a project that is not offered", () => {
		const game = new Game(oneTinyInitial);

		expect(() =>
			game.dispatch({ type: "acceptProject", payload: { projectId: "project-1" } }),
		).toThrow();
	});

	it("routes demand through a load balancer when projects and servers are attached", () => {
		const game = acceptBothProjects(new Game(offeredInitial(0)))
			.dispatch({ type: "buyServer", payload: { serverType: "tiny" } })
			.dispatch({ type: "buyServer", payload: { serverType: "tiny" } })
			.dispatch({ type: "buyLoadBalancer" })
			.dispatch({
				type: "attachProject",
				payload: { projectId: "project-1", loadBalancerId: "lb-1" },
			})
			.dispatch({
				type: "attachProject",
				payload: { projectId: "project-2", loadBalancerId: "lb-1" },
			})
			.dispatch({
				type: "attachServer",
				payload: { loadBalancerId: "lb-1", serverId: "server-1" },
			})
			.dispatch({
				type: "attachServer",
				payload: { loadBalancerId: "lb-1", serverId: "server-2" },
			})
			.tick();

		expect(game.metrics.droppedRequests).toBe(0);
		expect(game.metrics.handledRequests).toBe(1400);
	});

	it("throws when attaching a project that is already routed", () => {
		const game = acceptBothProjects(new Game(offeredInitial(0)))
			.dispatch({ type: "buyLoadBalancer" })
			.dispatch({
				type: "attachProject",
				payload: { projectId: "project-1", loadBalancerId: "lb-1" },
			});

		expect(() =>
			game.dispatch({
				type: "attachProject",
				payload: { projectId: "project-1", loadBalancerId: "lb-1" },
			}),
		).toThrow();
	});

	it("throws when attaching a server that already belongs to a load balancer", () => {
		const game = new Game(offeredInitial(1))
			.dispatch({ type: "buyLoadBalancer" })
			.dispatch({ type: "buyLoadBalancer" })
			.dispatch({
				type: "attachServer",
				payload: { loadBalancerId: "lb-1", serverId: "server-1" },
			});

		expect(() =>
			game.dispatch({
				type: "attachServer",
				payload: { loadBalancerId: "lb-2", serverId: "server-1" },
			}),
		).toThrow();
	});
});

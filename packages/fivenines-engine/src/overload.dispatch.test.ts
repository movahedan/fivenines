import { describe, expect, it } from "bun:test";

import { SKU_ECONOMY } from "./catalog/economy-policy";
import { constantProject } from "./fixtures";
import type { EngineCommand, GameInitial } from "./index";
import { Game, oneBronzeInitial } from "./index";

function offeredInitial(serverCount: 0 | 1): GameInitial {
	return {
		customers: [
			{
				id: "customer-1",
				projects: [
					constantProject("project-1", 700, "offered"),
					constantProject("project-2", 700, "offered"),
				],
			},
		],
		assets:
			serverCount === 1
				? [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }]
				: [],
	};
}

function acceptBothProjects(game: Game): Game {
	return game
		.dispatch({ type: "acceptProject", payload: { projectId: "project-1" } })
		.dispatch({ type: "acceptProject", payload: { projectId: "project-2" } });
}

describe("Game - dispatch", () => {
	it("drops requests on one Bronze and clears drops with lower p95 when offered projects are accepted and Bronze servers are bought", () => {
		const overloaded = acceptBothProjects(new Game(offeredInitial(1))).tick();

		const healthy = acceptBothProjects(
			new Game({
				...offeredInitial(0),
				cashCents: SKU_ECONOMY.bronze.purchaseCents * 2,
			}),
		)
			.dispatch({ type: "buyServer", payload: { serverType: "bronze", region: "utc+0" } })
			.dispatch({ type: "buyServer", payload: { serverType: "bronze", region: "utc+0" } })
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
		const game = acceptBothProjects(
			new Game({
				...offeredInitial(1),
				cashCents: SKU_ECONOMY.bronze.purchaseCents * 2,
			}),
		).dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: "utc+0" },
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
		const game = new Game(oneBronzeInitial);

		expect(() =>
			game.dispatch({ type: "acceptProject", payload: { projectId: "project-1" } }),
		).toThrow();
	});

	it("sets an offered project to declined without changing cash", () => {
		const game = new Game(offeredInitial(0));
		const cashCents = game.cashCents;

		game.dispatch({ type: "declineProject", payload: { projectId: "project-1" } });

		expect(game.customers[0]?.projects[0]?.status).toBe("declined");
		expect(game.customers[0]?.projects[1]?.status).toBe("offered");
		expect(game.cashCents).toBe(cashCents);
		expect(game.hourIndex).toBe(0);
	});

	it("throws when declining an unknown project", () => {
		const game = new Game(offeredInitial(0));

		expect(() =>
			game.dispatch({ type: "declineProject", payload: { projectId: "missing-project" } }),
		).toThrow("unknown project id: missing-project");
	});

	it("throws when declining a project that is not offered", () => {
		const game = new Game(oneBronzeInitial);

		expect(() =>
			game.dispatch({ type: "declineProject", payload: { projectId: "project-1" } }),
		).toThrow("project is not offered: project-1");
	});

	it("declines an offered project while jailed", () => {
		const game = new Game({
			...offeredInitial(0),
			jailed: true,
		});

		game.dispatch({ type: "declineProject", payload: { projectId: "project-1" } });

		expect(game.customers[0]?.projects[0]?.status).toBe("declined");
		expect(game.jailed).toBe(true);
	});

	it("removes a bought server when sellServer is dispatched", () => {
		const game = new Game(offeredInitial(0)).dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: "utc+0" },
		});

		expect(game.assets).toHaveLength(1);

		game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
	});

	it("throws when selling an unknown server", () => {
		const game = new Game(offeredInitial(0));

		expect(() =>
			game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } }),
		).toThrow();
	});
});

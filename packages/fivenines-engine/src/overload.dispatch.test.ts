import { describe, expect, it } from "bun:test";

import { SKU_ECONOMY } from "./catalog/economy-policy";
import { constantProject } from "./fixtures";
import type { EngineCommand, GameInitial, Server } from "./index";
import { Game, oneBronzeInitial, twoBronzeInitial } from "./index";

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
		.dispatch({
			type: "acceptProject",
			payload: { projectId: "project-1" },
		})
		.dispatch({
			type: "acceptProject",
			payload: { projectId: "project-2" },
		});
}

function buyBronze(game: Game): Game {
	return game.dispatch({ type: "buyServer", payload: { serverType: "bronze", region: "utc+0" } });
}

function serverOf(game: Game, serverId: string): Server | undefined {
	return game.servers.find((server) => server.id === serverId);
}

describe("Game - dispatch", () => {
	it("drops requests on one Bronze and clears drops with lower p95 when both projects are accepted onto their own Bronze", () => {
		const overloaded = new Game(oneBronzeInitial).tick();
		const healthy = new Game(twoBronzeInitial).tick();

		expect(overloaded.metrics.droppedRequests).toBeGreaterThan(0);
		expect(healthy.metrics.droppedRequests).toBe(0);
		expect(healthy.metrics.p95LatencyMs).toBeLessThan(overloaded.metrics.p95LatencyMs);
	});

	it("throws when command type is unknown", () => {
		const game = new Game(offeredInitial(0));

		expect(() => game.dispatch({ type: "nope" } as unknown as EngineCommand)).toThrow();
	});

	it("leaves metrics empty until tick after accept and buy", () => {
		const game = acceptBothProjects(new Game(offeredInitial(1)));

		expect(game.metrics).toEqual({
			handledRequests: 0,
			droppedRequests: 0,
			p95LatencyMs: 0,
			utilization: 0,
			errorPpm: 0,
		});

		game.tick();

		expect(game.metrics.handledRequests + game.metrics.droppedRequests).toBe(0);
		expect(game.customers[0]?.projects.every((project) => project.status === "accepted")).toBe(
			true,
		);
	});

	it("throws when accepting an unknown project", () => {
		const game = new Game(offeredInitial(1));

		expect(() =>
			game.dispatch({
				type: "acceptProject",
				payload: { projectId: "missing-project" },
			}),
		).toThrow("unknown project id: missing-project");
	});

	it("throws when starting onto a server the fleet does not own", () => {
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [
						{
							...constantProject("project-1", 700, "accepted"),
							ready: true,
						},
					],
				},
			],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
		});

		expect(() =>
			game.dispatch({
				type: "startProject",
				payload: { projectId: "project-1", serverId: "server-9" },
			}),
		).toThrow("unknown server id: server-9");
		expect(game.customers[0]?.projects[0]?.status).toBe("accepted");
	});

	it("throws when accepting a project that is not offered", () => {
		const game = new Game(oneBronzeInitial);

		expect(() =>
			game.dispatch({
				type: "acceptProject",
				payload: { projectId: "project-1" },
			}),
		).toThrow("project is not offered: project-1");
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
		const game = buyBronze(new Game(offeredInitial(0)));

		expect(game.assets).toHaveLength(1);

		game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
	});

	it("throws when selling an unknown server", () => {
		const game = new Game(offeredInitial(0));

		expect(() => game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } })).toThrow(
			"unknown server id: server-1",
		);
	});

	it("throws when selling a box a served project routes to and allows the sale once parked", () => {
		const game = new Game(oneBronzeInitial);

		expect(() => game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } })).toThrow(
			"server has a served project routed to it: project-1",
		);

		game.dispatch({ type: "unassignProject", payload: { projectId: "project-1" } });

		expect(() => game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } })).toThrow(
			"server has a served project routed to it: project-2",
		);

		game.dispatch({ type: "unassignProject", payload: { projectId: "project-2" } });
		game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
	});

	it("leaves the game untouched when a command is rejected", () => {
		const game = new Game(oneBronzeInitial);
		const before = {
			assetIds: game.assets.map((asset) => asset.id),
			statuses: game.customers.flatMap((customer) =>
				customer.projects.map((project) => project.status),
			),
			routes: game.customers.flatMap((customer) =>
				customer.projects.map((project) => project.route?.serverId),
			),
			cashCents: game.cashCents,
			jailed: game.jailed,
		};

		const rejected: readonly EngineCommand[] = [
			{ type: "sellServer", payload: { serverId: "server-1" } },
			{ type: "moveProject", payload: { projectId: "project-1", serverId: "server-404" } },
			{ type: "unassignProject", payload: { projectId: "project-404" } },
		];

		for (const command of rejected) {
			expect(() => game.dispatch(command)).toThrow();
		}

		expect({
			assetIds: game.assets.map((asset) => asset.id),
			statuses: game.customers.flatMap((customer) =>
				customer.projects.map((project) => project.status),
			),
			routes: game.customers.flatMap((customer) =>
				customer.projects.map((project) => project.route?.serverId),
			),
			cashCents: game.cashCents,
			jailed: game.jailed,
		}).toEqual(before);
	});
});

describe("Game - routing round trip", () => {
	it("moves a served project to another box, parks it, and brings it back", () => {
		const game = buyBronze(
			new Game({
				customers: [
					{
						id: "customer-1",
						projects: [constantProject("project-1", 700, "served", "server-1")],
					},
				],
				assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
				cashCents: SKU_ECONOMY.bronze.purchaseCents,
			}),
		);

		game.tick();

		expect(serverOf(game, "server-1")?.metrics.assignedRequests).toBe(700);
		expect(serverOf(game, "server-2")?.metrics.assignedRequests).toBe(0);

		game.dispatch({
			type: "moveProject",
			payload: { projectId: "project-1", serverId: "server-2" },
		});
		game.tick();

		expect(serverOf(game, "server-1")?.slices).toEqual([]);
		expect(serverOf(game, "server-2")?.metrics.assignedRequests).toBe(700);
		expect(
			serverOf(game, "server-2")?.slices.every((slice) => slice.projectId === "project-1"),
		).toBe(true);

		game.dispatch({ type: "unassignProject", payload: { projectId: "project-1" } });
		game.tick();

		expect(game.customers[0]?.projects[0]?.status).toBe("offline");
		expect(serverOf(game, "server-1")?.slices).toEqual([]);
		expect(serverOf(game, "server-2")?.slices).toEqual([]);
		expect(game.metrics.droppedRequests).toBe(700);

		game.dispatch({
			type: "assignProject",
			payload: { projectId: "project-1", serverId: "server-1" },
		});
		game.tick();

		expect(game.customers[0]?.projects[0]?.status).toBe("served");
		expect(serverOf(game, "server-1")?.metrics.assignedRequests).toBe(700);
		expect(serverOf(game, "server-2")?.slices).toEqual([]);
		expect(game.metrics.droppedRequests).toBe(0);
	});
});

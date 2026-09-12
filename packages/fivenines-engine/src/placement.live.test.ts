import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { constantProject, oneBronzeInitial, twoBronzeInitial } from "./fixtures";
import { Game } from "./game";

function readyAccepted(setupServerId?: string) {
	return {
		...constantProject("project-1", 700, "accepted"),
		ready: true,
		setupServerId,
	};
}

describe("Game - live placement follow-up", () => {
	it("keeps Game.tick free of topology and identity imports", () => {
		const gamePath = resolve(dirname(fileURLToPath(import.meta.url)), "game.ts");
		const source = readFileSync(gamePath, "utf8");

		expect(source.includes("topology/")).toBe(false);
		expect(source.includes("identity/")).toBe(false);
	});

	it("splits contended Bronze CPU equally when two served projects share one host", () => {
		const game = new Game(oneBronzeInitial).tick();
		const handled = Object.fromEntries(
			game.customers[0]?.projects.map((project) => [project.id, project.metrics.handledRequests]) ??
				[],
		);

		expect(game.metrics.handledRequests).toBe(1000);
		expect(handled["project-1"]).toBe(500);
		expect(handled["project-2"]).toBe(500);
		expect(game.assets).toHaveLength(1);
	});

	it("does not spill overload onto a second host", () => {
		const game = new Game(twoBronzeInitial).tick();

		expect(game.metrics.droppedRequests).toBe(0);
		expect(game.servers[0]?.metrics.assignedRequests).toBe(700);
		expect(game.servers[1]?.metrics.assignedRequests).toBe(700);
	});

	it("bills one box of opex when two projects share a host", () => {
		const shared = new Game(oneBronzeInitial).tick();
		const split = new Game(twoBronzeInitial).tick();

		expect(shared.assets).toHaveLength(1);
		expect(split.assets).toHaveLength(2);
		expect(shared.finance.opexCents).toBeLessThan(split.finance.opexCents);
		expect(shared.finance.maintenanceCents).toBe(split.finance.maintenanceCents / 2);
	});

	it("throws when startProject names a different box than setup placement", () => {
		const game = new Game({
			customers: [{ id: "customer-1", projects: [readyAccepted("server-1")] }],
			assets: [
				{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" },
				{ kind: "server", id: "server-2", catalogId: "bronze", region: "utc+0" },
			],
		});

		expect(() =>
			game.dispatch({
				type: "startProject",
				payload: { projectId: "project-1", serverId: "server-2" },
			}),
		).toThrow("start server mismatch: project-1");
		expect(game.customers[0]?.projects[0]?.status).toBe("accepted");
	});

	it("starts onto the setup box when placement is set", () => {
		const game = new Game({
			customers: [{ id: "customer-1", projects: [readyAccepted("server-1")] }],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
		});

		game.dispatch({
			type: "startProject",
			payload: { projectId: "project-1", serverId: "server-1" },
		});

		expect(game.customers[0]?.projects[0]?.status).toBe("served");
		expect(game.customers[0]?.projects[0]?.route).toEqual({ kind: "server", serverId: "server-1" });
	});

	it("starts when setup placement is unset", () => {
		const game = new Game({
			customers: [{ id: "customer-1", projects: [readyAccepted()] }],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
		});

		game.dispatch({
			type: "startProject",
			payload: { projectId: "project-1", serverId: "server-1" },
		});

		expect(game.customers[0]?.projects[0]?.status).toBe("served");
	});
});

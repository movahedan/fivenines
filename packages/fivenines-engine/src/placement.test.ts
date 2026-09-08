import { describe, expect, it } from "bun:test";

import { PAYG_ONLY_COMMERCIAL_STUB } from "./catalog/commercial-policy";
import { type RegionId, regions } from "./catalog/regions";
import { oneBronzeInitial, twoBronzeInitial } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./game";
import type { Project, ProjectCategory, ProjectInitial } from "./project";
import type { DemandSlice, Server } from "./server";

function servedProject(
	id: string,
	estimatedRequestsPerHour: number,
	region: RegionId,
	serverId: string,
	category: ProjectCategory = "saas",
): ProjectInitial {
	return {
		id,
		estimatedRequestsPerHour,
		status: "served",
		demand: "constant",
		category,
		region,
		campaignProne: false,
		commercial: PAYG_ONLY_COMMERCIAL_STUB,
		route: { kind: "server", serverId },
	};
}

function bronze(id: string, region: RegionId): GameInitial["assets"][number] {
	return { kind: "server", id, catalogId: "bronze", region };
}

function gameOf(projects: readonly ProjectInitial[], assets: GameInitial["assets"]): Game {
	return new Game({
		customers: [{ id: "customer-1", projects }],
		assets,
	});
}

function serverOf(game: Game, serverId: string): Server | undefined {
	return game.servers.find((server) => server.id === serverId);
}

function projectOf(game: Game, projectId: string): Project | undefined {
	return game.customers
		.flatMap((customer) => [...customer.projects])
		.find((project) => project.id === projectId);
}

function sliceRequests(slices: readonly DemandSlice[], remote: boolean): number {
	return slices.reduce((sum, slice) => (slice.remote === remote ? sum + slice.requests : sum), 0);
}

describe("Game - routed placement", () => {
	it("assigns every request to the routed box and leaves an unrouted box idle", () => {
		const game = gameOf(
			[servedProject("project-1", 700, "utc+0", "server-1")],
			[bronze("server-1", "utc+0"), bronze("server-2", "utc+0")],
		).tick();

		const routed = serverOf(game, "server-1");
		const idle = serverOf(game, "server-2");

		expect(routed?.metrics.assignedRequests).toBe(700);
		expect(sliceRequests(routed?.slices ?? [], false)).toBe(700);
		expect(sliceRequests(routed?.slices ?? [], true)).toBe(0);
		expect(idle?.metrics.assignedRequests).toBe(0);
		expect(idle?.slices).toEqual([]);
		expect(game.metrics.droppedRequests).toBe(0);
	});

	it("leaves the remainder unroutable when demand exceeds the routed box headroom", () => {
		const game = gameOf(
			[servedProject("project-1", 1400, "utc+0", "server-1")],
			[bronze("server-1", "utc+0")],
		).tick();

		const routed = serverOf(game, "server-1");

		expect(routed?.metrics.assignedRequests).toBe(1000);
		expect(game.metrics.handledRequests).toBe(1000);
		expect(game.metrics.droppedRequests).toBe(400);
		expect(projectOf(game, "project-1")?.metrics.unroutableRequests).toBe(400);
	});

	it("drops an overloaded project's leftover instead of spilling it onto the box next door", () => {
		const isolated = gameOf(
			[
				servedProject("project-a", 1400, "utc+0", "server-1"),
				servedProject("project-b", 700, "utc+0", "server-2"),
			],
			[bronze("server-1", "utc+0"), bronze("server-2", "utc+0")],
		).tick();
		const aloneOnServerTwo = gameOf(
			[servedProject("project-b", 700, "utc+0", "server-2")],
			[bronze("server-1", "utc+0"), bronze("server-2", "utc+0")],
		).tick();

		const neighbour = serverOf(isolated, "server-2");
		const overloaded = projectOf(isolated, "project-a");
		const untouched = projectOf(isolated, "project-b");

		expect(neighbour?.slices.some((slice) => slice.projectId === "project-a")).toBe(false);
		expect(neighbour?.metrics.assignedRequests).toBe(700);
		expect(untouched?.metrics.handledRequests).toBe(
			projectOf(aloneOnServerTwo, "project-b")?.metrics.handledRequests,
		);
		expect(untouched?.metrics.handledRequests).toBe(700);
		expect(overloaded?.metrics.handledRequests).toBe(1000);
		expect(overloaded?.metrics.unroutableRequests).toBe(400);
		expect(isolated.metrics.droppedRequests).toBe(400);
	});

	it("adds offset-hours times PLACEMENT_POLICY.latencyMsPerOffsetHour to p95 when the route crosses regions", () => {
		const assets = [bronze("server-1", "utc+0")];
		const local = gameOf([servedProject("project-1", 700, "utc+0", "server-1")], assets).tick();
		const nearRemote = gameOf(
			[servedProject("project-1", 700, "utc-5", "server-1")],
			assets,
		).tick();
		const farRemote = gameOf([servedProject("project-1", 700, "utc+9", "server-1")], assets).tick();
		const remoteSlices = nearRemote.servers.flatMap((server) => [...server.slices]);

		expect(remoteSlices.length).toBeGreaterThan(0);
		expect(remoteSlices.every((slice) => slice.remote)).toBe(true);
		expect(nearRemote.metrics.p95LatencyMs).toBe(
			local.metrics.p95LatencyMs + regions.remoteLatencyMs("utc-5", "utc+0"),
		);
		expect(farRemote.metrics.p95LatencyMs).toBe(
			local.metrics.p95LatencyMs + regions.remoteLatencyMs("utc+9", "utc+0"),
		);
		expect(farRemote.metrics.p95LatencyMs).toBeGreaterThan(nearRemote.metrics.p95LatencyMs);
	});

	it("drops 400 when two projects share one Bronze and drops none when each has its own", () => {
		const shared = new Game(oneBronzeInitial).tick();
		const isolated = new Game(twoBronzeInitial).tick();

		expect(shared.metrics.droppedRequests).toBe(400);
		expect(shared.metrics.handledRequests).toBe(1000);
		expect(isolated.metrics.droppedRequests).toBe(0);
		expect(isolated.metrics.handledRequests).toBe(1400);
		expect(isolated.metrics.p95LatencyMs).toBeLessThan(shared.metrics.p95LatencyMs);
	});
});

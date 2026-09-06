import { describe, expect, it } from "bun:test";

import { type RegionId, regions } from "./catalog/regions";
import { constantProject, oneBronzeInitial, twoBronzeInitial } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./game";
import type { ProjectCategory, ProjectInitial } from "./project";
import type { DemandSlice } from "./server";

function servedProject(
	id: string,
	estimatedRequestsPerHour: number,
	region: RegionId,
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

function sliceRequests(slices: readonly DemandSlice[], remote: boolean): number {
	return slices.reduce((sum, slice) => (slice.remote === remote ? sum + slice.requests : sum), 0);
}

describe("Game - prefer-local placement", () => {
	it("assigns zero remote slices when local servers have enough headroom", () => {
		const game = gameOf(
			[servedProject("project-1", 700, "utc+0")],
			[bronze("local-1", "utc+0"), bronze("remote-1", "utc+9")],
		).tick();

		const local = game.servers.find((server) => server.id === "local-1");
		const remote = game.servers.find((server) => server.id === "remote-1");

		expect(local?.metrics.assignedRequests).toBe(700);
		expect(sliceRequests(local?.slices ?? [], false)).toBe(700);
		expect(sliceRequests(local?.slices ?? [], true)).toBe(0);
		expect(remote?.metrics.assignedRequests).toBe(0);
		expect(game.metrics.droppedRequests).toBe(0);
	});

	it("assigns 500 local and 500 remote slices when local remaining headroom is 500 and demand is 1000", () => {
		const game = gameOf(
			[servedProject("fill-local", 500, "utc+0"), servedProject("overflow", 1000, "utc+0")],
			[bronze("local-1", "utc+0"), bronze("remote-1", "utc+9")],
		).tick();

		const local = game.servers.find((server) => server.id === "local-1");
		const remote = game.servers.find((server) => server.id === "remote-1");

		expect(local?.metrics.assignedRequests).toBe(1000);
		expect(sliceRequests(local?.slices ?? [], false)).toBe(1000);
		expect(sliceRequests(local?.slices ?? [], true)).toBe(0);
		expect(remote?.metrics.assignedRequests).toBe(500);
		expect(sliceRequests(remote?.slices ?? [], true)).toBe(500);
		expect(sliceRequests(remote?.slices ?? [], false)).toBe(0);
		expect(game.metrics.droppedRequests).toBe(0);
	});

	it("adds offset-hours times PLACEMENT_POLICY.latencyMsPerOffsetHour to p95 when servers exist only in another region", () => {
		const assets = [bronze("server-1", "utc+0")];
		const local = gameOf([servedProject("project-1", 700, "utc+0")], assets).tick();
		const nearRemote = gameOf([servedProject("project-1", 700, "utc-5")], assets).tick();
		const farRemote = gameOf([servedProject("project-1", 700, "utc+9")], assets).tick();
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

	it("drops requests on one utc+0 Bronze and clears drops with lower p95 on two utc+0 Bronze when demand is 1400", () => {
		const overloaded = new Game(oneBronzeInitial).tick();
		const healthy = new Game(twoBronzeInitial).tick();

		expect(overloaded.metrics.droppedRequests).toBe(400);
		expect(overloaded.metrics.handledRequests).toBe(1000);
		expect(healthy.metrics.droppedRequests).toBe(0);
		expect(healthy.metrics.p95LatencyMs).toBeLessThan(overloaded.metrics.p95LatencyMs);
	});

	it("leaves leftover demand unroutable when local headroom is exhausted and no other-region servers exist", () => {
		const game = gameOf(
			[constantProject("project-1", 700, "served"), constantProject("project-2", 700, "served")],
			[bronze("server-1", "utc+0")],
		).tick();

		expect(game.metrics.handledRequests).toBe(1000);
		expect(game.metrics.droppedRequests).toBe(400);
		expect(game.servers[0]?.metrics.assignedRequests).toBe(1000);
	});
});

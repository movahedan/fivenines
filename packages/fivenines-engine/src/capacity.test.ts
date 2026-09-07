import { describe, expect, it } from "bun:test";

import { oneBronzeInitial } from "./fixtures";
import { Game } from "./game";
import type { ProjectCategory } from "./project";
import { Server } from "./server";

function tickBox(
	category: ProjectCategory,
	requests: number,
	catalogId: "bronze" | "thin-ram",
): Server {
	const server = new Server({ id: "server-1", catalogId, region: "utc+0" });

	server.assignSlice({ category, requests, sourceRegion: "utc+0" });
	server.tick();

	return server;
}

describe("Server - category net load", () => {
	it("reports a higher netLoad for shopping than saas when assigned request counts match", () => {
		const shopping = tickBox("shopping", 700, "bronze");
		const saas = tickBox("saas", 700, "bronze");

		expect(shopping.metrics.netLoad).toBeGreaterThan(saas.metrics.netLoad);
		expect(shopping.metrics.netLoad).toBe(700 * 40);
		expect(saas.metrics.netLoad).toBe(700 * 10);
	});
});

describe("Server - tightest-axis drops", () => {
	it("drops assigned demand on thin-ram when 1400 requests fit CPU and net but not RAM", () => {
		const server = tickBox("saas", 1400, "thin-ram");

		expect(server.metrics.assignedRequests).toBe(1400);
		expect(server.metrics.cpuLoad).toBeLessThanOrEqual(server.computeUnitsPerHour);
		expect(server.metrics.netLoad).toBeLessThanOrEqual(server.networkBytesPerHour);
		expect(server.metrics.memOcc).toBeGreaterThan(server.memoryMiB);
		expect(server.metrics.droppedRequests).toBeGreaterThan(0);
		expect(server.metrics.handledRequests).toBeLessThan(1400);
	});

	it("handles 1000 and drops 400 on one utc+0 Bronze when demand is 1400", () => {
		const overloaded = new Game(oneBronzeInitial).tick();

		expect(overloaded.metrics.handledRequests).toBe(1000);
		expect(overloaded.metrics.droppedRequests).toBe(400);
		expect(overloaded.servers[0]?.metrics.cpuLoad).toBe(1000);
		expect(overloaded.servers[0]?.metrics.assignedRequests).toBe(1000);
	});
});

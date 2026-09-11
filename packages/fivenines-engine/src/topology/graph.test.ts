import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { TopologyGraph } from "./graph";

const EMPTY_CONFIG = { technologyId: null, settings: {} };

describe("topology graph - shared assets", () => {
	it("lets two projects place instances on the same asset", () => {
		const graph = seededGraph();

		graph.apply({
			type: "addService",
			payload: { id: "svc-a", projectId: "project-a", config: EMPTY_CONFIG },
		});
		graph.apply({
			type: "addService",
			payload: { id: "svc-b", projectId: "project-b", config: EMPTY_CONFIG },
		});
		graph.apply({
			type: "addInstance",
			payload: {
				id: "inst-a",
				serviceId: "svc-a",
				hostAssetId: "server-1",
				health: "ok",
				readiness: "ready",
			},
		});
		graph.apply({
			type: "addInstance",
			payload: {
				id: "inst-b",
				serviceId: "svc-b",
				hostAssetId: "server-1",
				health: "ok",
				readiness: "pending",
			},
		});

		expect(graph.asset("server-1").id).toBe("server-1");
		expect(graph.instancesOnAsset("server-1")).toEqual(["inst-a", "inst-b"]);
		expect(graph.instance("inst-a").hostAssetId).toBe(graph.instance("inst-b").hostAssetId);
	});
});

describe("topology graph - shared service config", () => {
	it("shares logical config across instances and isolates another project", () => {
		const graph = seededGraph();

		graph.apply({
			type: "addService",
			payload: {
				id: "svc-a",
				projectId: "project-a",
				config: { technologyId: "application-runtime", settings: { workers: "1" } },
			},
		});
		graph.apply({
			type: "addService",
			payload: {
				id: "svc-b",
				projectId: "project-b",
				config: { technologyId: "application-runtime", settings: { workers: "1" } },
			},
		});
		graph.apply({
			type: "addInstance",
			payload: {
				id: "inst-a1",
				serviceId: "svc-a",
				hostAssetId: "server-1",
				health: "ok",
				readiness: "ready",
			},
		});
		graph.apply({
			type: "addInstance",
			payload: {
				id: "inst-a2",
				serviceId: "svc-a",
				hostAssetId: "server-1",
				health: "down",
				readiness: "pending",
			},
		});

		graph.apply({
			type: "replaceServiceConfig",
			payload: {
				serviceId: "svc-a",
				config: { technologyId: "application-runtime", settings: { workers: "4" } },
			},
		});

		expect(graph.service("svc-a").config.settings.workers).toBe("4");
		expect(graph.instance("inst-a1").health).toBe("ok");
		expect(graph.instance("inst-a2").health).toBe("down");
		expect(graph.service("svc-b").config.settings.workers).toBe("1");
	});
});

describe("topology graph - atomic mutations", () => {
	it("rejects a missing host without keeping the instance", () => {
		const graph = seededGraph();

		graph.apply({
			type: "addService",
			payload: { id: "svc-a", projectId: "project-a", config: EMPTY_CONFIG },
		});

		expect(() =>
			graph.apply({
				type: "addInstance",
				payload: {
					id: "inst-a",
					serviceId: "svc-a",
					hostAssetId: "missing",
					health: "ok",
					readiness: "ready",
				},
			}),
		).toThrow("unknown asset id: missing");

		expect(() => graph.instance("inst-a")).toThrow("unknown instance id: inst-a");
	});

	it("rejects a dependency cycle without keeping the edge", () => {
		const graph = seededGraph();

		graph.apply({
			type: "addService",
			payload: { id: "svc-a", projectId: "project-a", config: EMPTY_CONFIG },
		});
		graph.apply({
			type: "addService",
			payload: { id: "svc-b", projectId: "project-a", config: EMPTY_CONFIG },
		});
		graph.apply({
			type: "addDependency",
			payload: { fromServiceId: "svc-a", toServiceId: "svc-b" },
		});

		expect(() =>
			graph.apply({
				type: "addDependency",
				payload: { fromServiceId: "svc-b", toServiceId: "svc-a" },
			}),
		).toThrow("dependency cycle");
	});
});

describe("topology graph - Game boundary", () => {
	it("keeps Game.tick free of topology imports", () => {
		const gamePath = resolve(dirname(fileURLToPath(import.meta.url)), "../game.ts");
		const source = readFileSync(gamePath, "utf8");

		expect(source.includes("topology/")).toBe(false);
	});
});

function seededGraph(): TopologyGraph {
	const graph = new TopologyGraph();

	graph.seedIdentities([
		{ kind: "customer", id: "acme", ownerId: null },
		{ kind: "project", id: "project-a", ownerId: "acme" },
		{ kind: "project", id: "project-b", ownerId: "acme" },
	]);
	graph.apply({ type: "addAsset", payload: { id: "server-1", ownerId: "game" } });

	return graph;
}

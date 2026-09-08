import { describe, expect, it } from "bun:test";

import { SKU_ECONOMY, salvageCents } from "./catalog/economy-policy";
import { Customer } from "./customer";
import { constantProject } from "./fixtures";
import type { GameGraph } from "./game.utils";
import { applyCommand } from "./game.utils";
import type { Project, ProjectStatus } from "./project";
import { Server } from "./server";

function bronze(id: string): Server {
	return new Server({ id, catalogId: "bronze", region: "utc+0" });
}

function graphOf(
	status: ProjectStatus,
	options: { assets?: readonly Server[]; jailed?: boolean } = {},
): GameGraph {
	return {
		customers: [
			new Customer({
				id: "customer-1",
				projects: [
					constantProject("project-1", 700, status, status === "served" ? "server-1" : undefined),
				],
			}),
		],
		assets: options.assets ?? [bronze("server-1"), bronze("server-2")],
		cashCents: 40_000,
		jailed: options.jailed ?? false,
	};
}

function projectOf(graph: GameGraph): Project | undefined {
	return graph.customers[0]?.projects[0];
}

describe("applyCommand - acceptProject", () => {
	it("returns new customers and leaves the input graph unchanged", () => {
		const graph = graphOf("offered");

		const next = applyCommand(graph, {
			type: "acceptProject",
			payload: { projectId: "project-1", serverId: "server-1" },
		});

		expect(projectOf(graph)?.status).toBe("offered");
		expect(projectOf(next)?.status).toBe("served");
		expect(projectOf(next)?.route).toEqual({ kind: "server", serverId: "server-1" });
		expect(next.customers).not.toBe(graph.customers);
	});

	it("throws when the serverId does not exist", () => {
		expect(() =>
			applyCommand(graphOf("offered"), {
				type: "acceptProject",
				payload: { projectId: "project-1", serverId: "server-9" },
			}),
		).toThrow("unknown server id: server-9");
	});

	it("throws when the fleet is empty", () => {
		expect(() =>
			applyCommand(graphOf("offered", { assets: [] }), {
				type: "acceptProject",
				payload: { projectId: "project-1", serverId: "server-1" },
			}),
		).toThrow("unknown server id: server-1");
	});
});

describe("applyCommand - declineProject", () => {
	it("returns declined status and leaves the input graph and cash unchanged", () => {
		const graph = graphOf("offered");

		const next = applyCommand(graph, {
			type: "declineProject",
			payload: { projectId: "project-1" },
		});

		expect(projectOf(graph)?.status).toBe("offered");
		expect(projectOf(next)?.status).toBe("declined");
		expect(next.cashCents).toBe(40_000);
		expect(next.customers).not.toBe(graph.customers);
	});

	it("throws when the project id is unknown", () => {
		expect(() =>
			applyCommand(graphOf("offered"), {
				type: "declineProject",
				payload: { projectId: "missing-project" },
			}),
		).toThrow("unknown project id: missing-project");
	});

	it("throws when the project is not offered", () => {
		expect(() =>
			applyCommand(graphOf("served"), {
				type: "declineProject",
				payload: { projectId: "project-1" },
			}),
		).toThrow("project is not offered: project-1");
	});

	it("declines an offered project while jailed without changing cash", () => {
		const next = applyCommand(graphOf("offered", { jailed: true }), {
			type: "declineProject",
			payload: { projectId: "project-1" },
		});

		expect(projectOf(next)?.status).toBe("declined");
		expect(next.cashCents).toBe(40_000);
		expect(next.jailed).toBe(true);
	});
});

describe("applyCommand - routing commands", () => {
	it("moves a served project onto another box", () => {
		const next = applyCommand(graphOf("served"), {
			type: "moveProject",
			payload: { projectId: "project-1", serverId: "server-2" },
		});

		expect(projectOf(next)?.status).toBe("served");
		expect(projectOf(next)?.route).toEqual({ kind: "server", serverId: "server-2" });
	});

	it("parks a served project and clears its route", () => {
		const next = applyCommand(graphOf("served"), {
			type: "unassignProject",
			payload: { projectId: "project-1" },
		});

		expect(projectOf(next)?.status).toBe("offline");
		expect(projectOf(next)?.route).toBeUndefined();
	});

	it("brings a parked project back onto a box", () => {
		const next = applyCommand(graphOf("offline"), {
			type: "assignProject",
			payload: { projectId: "project-1", serverId: "server-2" },
		});

		expect(projectOf(next)?.status).toBe("served");
		expect(projectOf(next)?.route).toEqual({ kind: "server", serverId: "server-2" });
	});

	it("throws when a routing command names a server that does not exist", () => {
		for (const type of ["moveProject", "assignProject"] as const) {
			expect(() =>
				applyCommand(graphOf(type === "moveProject" ? "served" : "offline"), {
					type,
					payload: { projectId: "project-1", serverId: "server-9" },
				}),
			).toThrow("unknown server id: server-9");
		}
	});
});

describe("applyCommand - status guards", () => {
	it("throws when acceptProject targets a project that is not offered", () => {
		for (const status of ["served", "declined", "offline"] as const) {
			expect(() =>
				applyCommand(graphOf(status), {
					type: "acceptProject",
					payload: { projectId: "project-1", serverId: "server-2" },
				}),
			).toThrow("project is not offered: project-1");
		}
	});

	it("throws when moveProject or unassignProject targets a project that is not served", () => {
		for (const status of ["offered", "declined", "offline"] as const) {
			expect(() =>
				applyCommand(graphOf(status), {
					type: "moveProject",
					payload: { projectId: "project-1", serverId: "server-2" },
				}),
			).toThrow("project is not served: project-1");
			expect(() =>
				applyCommand(graphOf(status), {
					type: "unassignProject",
					payload: { projectId: "project-1" },
				}),
			).toThrow("project is not served: project-1");
		}
	});

	it("throws when assignProject targets a project that is not offline", () => {
		for (const status of ["offered", "declined", "served"] as const) {
			expect(() =>
				applyCommand(graphOf(status), {
					type: "assignProject",
					payload: { projectId: "project-1", serverId: "server-2" },
				}),
			).toThrow("project is not offline: project-1");
		}
	});
});

describe("applyCommand - jail guards", () => {
	it("throws when acceptProject or buyServer runs while jailed", () => {
		expect(() =>
			applyCommand(graphOf("offered", { jailed: true }), {
				type: "acceptProject",
				payload: { projectId: "project-1", serverId: "server-1" },
			}),
		).toThrow("cannot acceptProject while jailed");
		expect(() =>
			applyCommand(graphOf("offered", { jailed: true }), {
				type: "buyServer",
				payload: { serverType: "bronze", region: "utc+0" },
			}),
		).toThrow("cannot buyServer while jailed");
	});

	it("moves, parks, reassigns and sells while jailed", () => {
		const moved = applyCommand(graphOf("served", { jailed: true }), {
			type: "moveProject",
			payload: { projectId: "project-1", serverId: "server-2" },
		});
		const parked = applyCommand(graphOf("served", { jailed: true }), {
			type: "unassignProject",
			payload: { projectId: "project-1" },
		});
		const reassigned = applyCommand(graphOf("offline", { jailed: true }), {
			type: "assignProject",
			payload: { projectId: "project-1", serverId: "server-1" },
		});
		const sold = applyCommand(graphOf("offline", { jailed: true }), {
			type: "sellServer",
			payload: { serverId: "server-1" },
		});

		expect(projectOf(moved)?.route).toEqual({ kind: "server", serverId: "server-2" });
		expect(projectOf(parked)?.status).toBe("offline");
		expect(projectOf(reassigned)?.status).toBe("served");
		expect(sold.assets.map((asset) => asset.id)).toEqual(["server-2"]);
		expect(sold.cashCents).toBe(40_000 + salvageCents(SKU_ECONOMY.bronze.purchaseCents));
	});
});

describe("applyCommand - sellServer", () => {
	it("throws when a served project routes to the box", () => {
		expect(() =>
			applyCommand(graphOf("served"), {
				type: "sellServer",
				payload: { serverId: "server-1" },
			}),
		).toThrow("server has a served project routed to it: project-1");
	});

	it("sells the same box once the project is parked", () => {
		const parked = applyCommand(graphOf("served"), {
			type: "unassignProject",
			payload: { projectId: "project-1" },
		});

		const sold = applyCommand(parked, {
			type: "sellServer",
			payload: { serverId: "server-1" },
		});

		expect(sold.assets.map((asset) => asset.id)).toEqual(["server-2"]);
		expect(sold.cashCents).toBe(40_000 + salvageCents(SKU_ECONOMY.bronze.purchaseCents));
	});

	it("sells a box that no project routes to", () => {
		const sold = applyCommand(graphOf("served"), {
			type: "sellServer",
			payload: { serverId: "server-2" },
		});

		expect(sold.assets.map((asset) => asset.id)).toEqual(["server-1"]);
	});
});

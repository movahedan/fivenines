import { describe, expect, it } from "bun:test";

import { Customer } from "./customer";
import { constantProject } from "./fixtures";
import { applyCommand } from "./game.utils";

describe("applyCommand - acceptProject", () => {
	it("returns new customers and leaves the input graph unchanged", () => {
		const customers = [
			new Customer({
				id: "customer-1",
				projects: [constantProject("project-1", 700, "offered")],
			}),
		];
		const graph = {
			customers,
			assets: [],
			cashCents: 40_000,
			jailed: false,
		};

		const next = applyCommand(graph, {
			type: "acceptProject",
			payload: { projectId: "project-1" },
		});

		expect(graph.customers[0]?.projects[0]?.status).toBe("offered");
		expect(next.customers[0]?.projects[0]?.status).toBe("served");
		expect(next.customers).not.toBe(graph.customers);
	});
});

describe("applyCommand - declineProject", () => {
	it("returns declined status and leaves the input graph and cash unchanged", () => {
		const customers = [
			new Customer({
				id: "customer-1",
				projects: [constantProject("project-1", 700, "offered")],
			}),
		];
		const graph = {
			customers,
			assets: [],
			cashCents: 40_000,
			jailed: false,
		};

		const next = applyCommand(graph, {
			type: "declineProject",
			payload: { projectId: "project-1" },
		});

		expect(graph.customers[0]?.projects[0]?.status).toBe("offered");
		expect(next.customers[0]?.projects[0]?.status).toBe("declined");
		expect(next.cashCents).toBe(40_000);
		expect(next.customers).not.toBe(graph.customers);
	});

	it("throws when the project id is unknown", () => {
		const graph = {
			customers: [
				new Customer({
					id: "customer-1",
					projects: [constantProject("project-1", 700, "offered")],
				}),
			],
			assets: [],
			cashCents: 40_000,
			jailed: false,
		};

		expect(() =>
			applyCommand(graph, { type: "declineProject", payload: { projectId: "missing-project" } }),
		).toThrow("unknown project id: missing-project");
	});

	it("throws when the project is not offered", () => {
		const graph = {
			customers: [
				new Customer({
					id: "customer-1",
					projects: [constantProject("project-1", 700, "served")],
				}),
			],
			assets: [],
			cashCents: 40_000,
			jailed: false,
		};

		expect(() =>
			applyCommand(graph, { type: "declineProject", payload: { projectId: "project-1" } }),
		).toThrow("project is not offered: project-1");
	});

	it("declines an offered project while jailed without changing cash", () => {
		const graph = {
			customers: [
				new Customer({
					id: "customer-1",
					projects: [constantProject("project-1", 700, "offered")],
				}),
			],
			assets: [],
			cashCents: 40_000,
			jailed: true,
		};

		const next = applyCommand(graph, {
			type: "declineProject",
			payload: { projectId: "project-1" },
		});

		expect(next.customers[0]?.projects[0]?.status).toBe("declined");
		expect(next.cashCents).toBe(40_000);
		expect(next.jailed).toBe(true);
	});
});

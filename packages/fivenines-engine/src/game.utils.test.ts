import { describe, expect, it } from "bun:test";

import { Customer } from "./customer";
import { applyCommand } from "./game.utils";

describe("applyCommand - acceptProject", () => {
	it("returns new customers and leaves the input graph unchanged", () => {
		const customers = [
			new Customer({
				id: "customer-1",
				projects: [{ id: "project-1", estimatedRequestsPerHour: 700, status: "offered" }],
			}),
		];
		const graph = {
			customers,
			assets: [],
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

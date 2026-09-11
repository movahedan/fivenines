import { describe, expect, it } from "bun:test";

import { estimateRootLatency } from "./latency";
import { countRootOutcomes, evaluateRootOutcomes, type NodeProgress } from "./outcomes";
import { optionalChildren, type WorkGraph, type WorkGraphNode } from "./paths";

describe("work - root outcomes", () => {
	it("counts each customer root once on a converging required graph", () => {
		const graph = sharedDatabaseGraph();
		const progress = progressOf({
			"read-a": "success",
			"app-a": "success",
			"read-b": "success",
			"app-b": "success",
			db: "fail",
		});
		const outcomes = evaluateRootOutcomes(graph, progress);

		expect(countRootOutcomes(outcomes)).toEqual({ success: 0, fail: 2, pending: 0 });
		expect(outcomes.map((row) => row.rootId)).toEqual(["read-a", "read-b"]);
	});

	it("fails a root when a required child fails", () => {
		const graph = paymentGraph();
		const progress = progressOf({
			payment: "success",
			app: "success",
			gateway: "fail",
			record: "success",
			email: "success",
		});

		expect(evaluateRootOutcomes(graph, progress)[0]?.status).toBe("fail");
	});

	it("keeps a shop payment successful when optional receipt email fails", () => {
		const graph = paymentGraph();
		const progress = progressOf({
			payment: "success",
			app: "success",
			gateway: "success",
			record: "success",
			email: "fail",
		});
		const outcomes = evaluateRootOutcomes(graph, progress);

		expect(outcomes).toEqual([{ rootId: "payment", status: "success" }]);
		expect(countRootOutcomes(outcomes).success).toBe(1);
		expect(optionalChildren(graph, "payment")).toEqual(["email"]);
	});

	it("does not treat optional email as another customer root", () => {
		const graph = paymentGraph();
		const progress = progressOf({
			payment: "success",
			app: "success",
			gateway: "success",
			record: "success",
			email: "success",
		});

		expect(graph.roots).toEqual(["payment"]);
		expect(evaluateRootOutcomes(graph, progress)).toHaveLength(1);
	});

	it("reports pending when required work is still waiting", () => {
		const graph = paymentGraph();
		const progress = progressOf({
			payment: "success",
			app: "pending",
			gateway: "success",
			record: "success",
			email: "fail",
		});

		expect(evaluateRootOutcomes(graph, progress)[0]?.status).toBe("pending");
	});

	it("does not change outcomes when nodes and edges are reordered", () => {
		const graph = sharedDatabaseGraph();
		const shuffled: WorkGraph = {
			roots: ["read-b", "read-a"],
			nodes: [...graph.nodes].reverse(),
			edges: [...graph.edges].reverse(),
		};
		const progress = progressOf({
			"read-a": "success",
			"app-a": "success",
			"read-b": "success",
			"app-b": "success",
			db: "success",
		});

		expect(evaluateRootOutcomes(shuffled, progress)).toEqual(evaluateRootOutcomes(graph, progress));
	});
});

describe("work - latency estimates", () => {
	it("joins parallel required branches instead of summing them", () => {
		const graph: WorkGraph = {
			roots: ["root"],
			nodes: [node("root", 0, 1), node("left", 2, 3), node("right", 1, 1)],
			edges: [
				{ from: "root", to: "left", kind: "required" },
				{ from: "root", to: "right", kind: "required" },
			],
		};

		expect(estimateRootLatency(graph, "root")).toBe(6);
	});

	it("adds series stages and ignores optional children", () => {
		const graph: WorkGraph = {
			roots: ["payment"],
			nodes: [node("payment", 0, 1), node("app", 0, 2), node("email", 10, 10)],
			edges: [
				{ from: "payment", to: "app", kind: "required" },
				{ from: "payment", to: "email", kind: "optional" },
			],
		};

		expect(estimateRootLatency(graph, "payment")).toBe(3);
	});
});

function paymentGraph(): WorkGraph {
	return {
		roots: ["payment"],
		nodes: [
			node("payment", 0, 1),
			node("app", 0, 1),
			node("gateway", 0, 1),
			node("record", 0, 1),
			node("email", 0, 1),
		],
		edges: [
			{ from: "payment", to: "app", kind: "required" },
			{ from: "payment", to: "gateway", kind: "required" },
			{ from: "payment", to: "record", kind: "required" },
			{ from: "payment", to: "email", kind: "optional" },
		],
	};
}

function sharedDatabaseGraph(): WorkGraph {
	return {
		roots: ["read-a", "read-b"],
		nodes: [
			node("read-a", 0, 1),
			node("app-a", 0, 1),
			node("read-b", 0, 1),
			node("app-b", 0, 1),
			node("db", 0, 1),
		],
		edges: [
			{ from: "read-a", to: "app-a", kind: "required" },
			{ from: "app-a", to: "db", kind: "required" },
			{ from: "read-b", to: "app-b", kind: "required" },
			{ from: "app-b", to: "db", kind: "required" },
		],
	};
}

function node(id: string, wait: number, processing: number): WorkGraphNode {
	return { id, wait, processing };
}

function progressOf(values: Record<string, NodeProgress>): Map<string, NodeProgress> {
	return new Map(Object.entries(values));
}

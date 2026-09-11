import { describe, expect, it } from "bun:test";

import { compileDemandGraph } from "./compile";
import { estimateRootLatency } from "./latency";
import { countRootOutcomes, evaluateRootOutcomes } from "./outcomes";
import { optionalChildren } from "./paths";

describe("work - compiled demand graphs", () => {
	it("keeps payment receipt email optional and not a second root", () => {
		const compiled = compileDemandGraph("payment");

		expect(compiled.graph.roots).toEqual(["payment"]);
		expect(optionalChildren(compiled.graph, "payment")).toEqual(["email"]);
		expect(compiled.nodeWork.some((row) => row.nodeId === "email" && row.optional)).toBe(true);
	});

	it("joins parallel payment branches by max wait instead of summing them", () => {
		expect(estimateRootLatency(compileDemandGraph("payment").graph, "payment")).toBe(2);
	});

	it("uses series application then database for page reads", () => {
		const compiled = compileDemandGraph("page-read");

		expect(estimateRootLatency(compiled.graph, "page-read")).toBe(3);
	});

	it("places GPU inference and finite jobs on a worker path, not CPU fallback", () => {
		expect(
			compileDemandGraph("inference-gpu").nodeWork.some((row) => row.dimension === "gpuWork"),
		).toBe(true);
		expect(compileDemandGraph("email-message").graph.roots).toEqual(["email-message"]);
		expect(compileDemandGraph("transcode-job").graph.nodes.map((row) => row.id)).toContain(
			"storage",
		);
	});

	it("fails a payment root when the required gateway fails and ignores optional email", () => {
		const graph = compileDemandGraph("payment").graph;
		const failedGateway = new Map([
			["payment", "success"],
			["app", "success"],
			["gateway", "fail"],
			["record", "success"],
			["email", "success"],
		] as const);

		expect(evaluateRootOutcomes(graph, failedGateway)[0]?.status).toBe("fail");

		const failedEmail = new Map([
			["payment", "success"],
			["app", "success"],
			["gateway", "success"],
			["record", "success"],
			["email", "fail"],
		] as const);

		expect(evaluateRootOutcomes(graph, failedEmail)).toEqual([
			{ rootId: "payment", status: "success" },
		]);
		expect(countRootOutcomes(evaluateRootOutcomes(graph, failedEmail)).success).toBe(1);
	});
});

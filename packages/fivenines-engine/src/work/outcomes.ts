import { requiredReachable, type WorkGraph } from "./paths";

export type NodeProgress = "success" | "fail" | "pending";

export interface RootOutcome {
	rootId: string;
	status: NodeProgress;
}

export function evaluateRootOutcomes(
	graph: WorkGraph,
	progress: ReadonlyMap<string, NodeProgress>,
): RootOutcome[] {
	const roots = [...graph.roots].sort();

	return roots.map((rootId) => ({
		rootId,
		status: evaluateOneRoot(graph, rootId, progress),
	}));
}

export function countRootOutcomes(outcomes: readonly RootOutcome[]): {
	success: number;
	fail: number;
	pending: number;
} {
	return {
		success: outcomes.filter((row) => row.status === "success").length,
		fail: outcomes.filter((row) => row.status === "fail").length,
		pending: outcomes.filter((row) => row.status === "pending").length,
	};
}

function evaluateOneRoot(
	graph: WorkGraph,
	rootId: string,
	progress: ReadonlyMap<string, NodeProgress>,
): NodeProgress {
	const required = requiredReachable(graph, rootId);
	let pending = false;

	for (const nodeId of required) {
		const status = progress.get(nodeId) ?? "pending";

		if (status === "fail") {
			return "fail";
		}

		if (status !== "success") {
			pending = true;
		}
	}

	return pending ? "pending" : "success";
}

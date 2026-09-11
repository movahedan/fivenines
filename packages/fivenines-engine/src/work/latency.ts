import { nodeById, requiredReachable, type WorkGraph } from "./paths";

export function estimateRootLatency(graph: WorkGraph, rootId: string): number {
	const required = requiredReachable(graph, rootId);
	const nodes = nodeById(graph);
	const finish = new Map<string, number>();
	const remaining = new Set(required);

	while (remaining.size > 0) {
		const ready = [...remaining].filter((nodeId) =>
			requiredPredecessors(graph, nodeId, required).every((predecessor) => finish.has(predecessor)),
		);

		if (ready.length === 0) {
			throw new Error(`cyclic required path at root ${rootId}`);
		}

		ready.sort();

		for (const nodeId of ready) {
			const node = nodes.get(nodeId);

			if (node === undefined) {
				throw new Error(`unknown node: ${nodeId}`);
			}

			const start = maxFinish(requiredPredecessors(graph, nodeId, required), finish);
			finish.set(nodeId, start + node.wait + node.processing);
			remaining.delete(nodeId);
		}
	}

	return maxFinish([...required], finish);
}

function requiredPredecessors(
	graph: WorkGraph,
	nodeId: string,
	required: ReadonlySet<string>,
): readonly string[] {
	return graph.edges
		.filter((edge) => edge.to === nodeId && edge.kind === "required" && required.has(edge.from))
		.map((edge) => edge.from);
}

function maxFinish(nodeIds: readonly string[], finish: ReadonlyMap<string, number>): number {
	let max = 0;

	for (const nodeId of nodeIds) {
		const value = finish.get(nodeId) ?? 0;

		if (value > max) {
			max = value;
		}
	}

	return max;
}

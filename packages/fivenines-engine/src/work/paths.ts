export type EdgeKind = "required" | "optional";

export interface WorkGraphNode {
	id: string;
	wait: number;
	processing: number;
}

export interface WorkGraphEdge {
	from: string;
	to: string;
	kind: EdgeKind;
}

export interface WorkGraph {
	roots: readonly string[];
	nodes: readonly WorkGraphNode[];
	edges: readonly WorkGraphEdge[];
}

export function nodeById(graph: WorkGraph): Map<string, WorkGraphNode> {
	return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function requiredReachable(graph: WorkGraph, rootId: string): Set<string> {
	const reachable = new Set<string>([rootId]);
	const queue = [rootId];

	while (queue.length > 0) {
		const current = queue.shift();

		if (current === undefined) {
			break;
		}

		for (const edge of graph.edges) {
			if (edge.from !== current || edge.kind !== "required" || reachable.has(edge.to)) {
				continue;
			}

			reachable.add(edge.to);
			queue.push(edge.to);
		}
	}

	return reachable;
}

export function optionalChildren(graph: WorkGraph, nodeId: string): readonly string[] {
	return graph.edges
		.filter((edge) => edge.from === nodeId && edge.kind === "optional")
		.map((edge) => edge.to)
		.sort();
}

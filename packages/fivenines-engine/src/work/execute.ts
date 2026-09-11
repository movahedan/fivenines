import type { DemandWaitPolicy } from "../catalog/demand-types";
import { type CompiledDemandGraph, compileDemandGraph } from "./compile";
import { estimateRootLatency } from "./latency";
import { countRootOutcomes, evaluateRootOutcomes, type NodeProgress } from "./outcomes";
import type { WorkSettlement } from "./share";

export interface PathHourSummary {
	readonly success: number;
	readonly fail: number;
	readonly pending: number;
	readonly estimatedLatency: number;
}

export const EMPTY_PATH_HOUR: PathHourSummary = {
	success: 0,
	fail: 0,
	pending: 0,
	estimatedLatency: 0,
};

export function mergePathHours(left: PathHourSummary, right: PathHourSummary): PathHourSummary {
	return {
		success: left.success + right.success,
		fail: left.fail + right.fail,
		pending: left.pending + right.pending,
		estimatedLatency: Math.max(left.estimatedLatency, right.estimatedLatency),
	};
}

export function categoryPathHour(assigned: number, emitted: number): PathHourSummary {
	const success = Math.min(assigned, emitted);
	const fail = Math.max(0, emitted - success);

	return {
		success,
		fail,
		pending: 0,
		estimatedLatency: success > 0 ? 1 : 0,
	};
}

export function demandTypePathHour(
	demandTypeId: Parameters<typeof compileDemandGraph>[0],
	waitPolicy: DemandWaitPolicy,
	rootCount: number,
	settlementsByNode: ReadonlyMap<string, readonly WorkSettlement[]>,
): PathHourSummary {
	if (rootCount <= 0) {
		return EMPTY_PATH_HOUR;
	}

	const compiled = compileDemandGraph(demandTypeId);
	const progress = nodeProgress(compiled, waitPolicy, settlementsByNode);
	const outcomes = evaluateRootOutcomes(compiled.graph, progress);
	const counted = countRootOutcomes(outcomes);
	const scaled = scaleOutcomes(counted, rootCount);

	return {
		...scaled,
		estimatedLatency: estimateRootLatency(compiled.graph, compiled.graph.roots[0] ?? demandTypeId),
	};
}

function nodeProgress(
	compiled: CompiledDemandGraph,
	waitPolicy: DemandWaitPolicy,
	settlementsByNode: ReadonlyMap<string, readonly WorkSettlement[]>,
): Map<string, NodeProgress> {
	const progress = new Map<string, NodeProgress>();

	for (const rootId of compiled.graph.roots) {
		progress.set(rootId, "success");
	}

	const nodeIds = new Set(compiled.nodeWork.map((row) => row.nodeId));

	for (const nodeId of nodeIds) {
		progress.set(nodeId, statusForNode(settlementsByNode.get(nodeId) ?? [], waitPolicy));
	}

	return progress;
}

function statusForNode(
	settlements: readonly WorkSettlement[],
	waitPolicy: DemandWaitPolicy,
): NodeProgress {
	if (settlements.length === 0) {
		return "pending";
	}

	if (settlements.some((row) => row.infeasible > 0)) {
		return "fail";
	}

	const waiting = settlements.reduce((sum, row) => sum + row.waiting, 0);
	const rejected = settlements.reduce((sum, row) => sum + row.rejected, 0);

	if (waiting > 0 && (waitPolicy === "queued" || waitPolicy === "job")) {
		return "pending";
	}

	if (rejected > 0) {
		return "fail";
	}

	return "success";
}

function scaleOutcomes(
	counted: { success: number; fail: number; pending: number },
	rootCount: number,
): Pick<PathHourSummary, "success" | "fail" | "pending"> {
	if (counted.fail > 0) {
		return { success: 0, fail: rootCount, pending: 0 };
	}

	if (counted.pending > 0) {
		return { success: 0, fail: 0, pending: rootCount };
	}

	return { success: rootCount, fail: 0, pending: 0 };
}

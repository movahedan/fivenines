import {
	DEMAND_COST_MICRO,
	type DemandType,
	type DemandTypeId,
	demandTypeById,
} from "../catalog/demand-types";
import type { WorkGraph, WorkGraphEdge, WorkGraphNode } from "./paths";
import type { WorkDimension } from "./units";

export interface CompiledNodeWork {
	readonly nodeId: string;
	readonly dimension: WorkDimension;
	readonly amountPerRequest: number;
	readonly gpuWorkPerRequest: number;
	readonly gpuMemoryMiB: number;
	readonly optional: boolean;
}

export interface CompiledDemandGraph {
	readonly graph: WorkGraph;
	readonly nodeWork: readonly CompiledNodeWork[];
}

export function compileDemandGraph(demandTypeId: DemandTypeId): CompiledDemandGraph {
	const demandType = demandTypeById(demandTypeId);

	switch (demandTypeId) {
		case "page-read":
		case "record-write":
		case "mailbox-read":
			return seriesAppThenDb(demandTypeId, demandType);
		case "chat-message":
			return seriesAppThenDb(demandTypeId, demandType);
		case "payment":
			return paymentGraph(demandType);
		case "email-message":
		case "event-ingest":
			return workerOnly(demandTypeId, demandType, "cpuWork");
		case "dns-query":
		case "video-minute":
		case "live-minute":
		case "call-minute":
		case "game-session-minute":
			return workerOnly(demandTypeId, demandType, "networkMiB");
		case "search-query":
		case "inference-cpu":
			return workerOnly(demandTypeId, demandType, "cpuWork");
		case "inference-gpu":
			return gpuWorker(demandTypeId, demandType);
		case "analytics-job":
		case "transcode-job":
		case "batch-job":
		case "training-job":
		case "distributed-training-job":
			return jobWithStorage(demandTypeId, demandType);
	}
}

function node(id: string, wait: number, processing: number): WorkGraphNode {
	return { id, wait, processing };
}

function edge(from: string, to: string, kind: WorkGraphEdge["kind"]): WorkGraphEdge {
	return { from, to, kind };
}

function cpuPerRequest(micro: number): number {
	return Math.max(0, Math.round(micro / DEMAND_COST_MICRO));
}

function seriesAppThenDb(id: DemandTypeId, demandType: DemandType): CompiledDemandGraph {
	return {
		graph: {
			roots: [id],
			nodes: [node(id, 0, 1), node("app", 0, 1), node("db", 0, 1)],
			edges: [edge(id, "app", "required"), edge("app", "db", "required")],
		},
		nodeWork: [
			cpuNode("app", demandType.applicationCpuWorkMicro, false),
			cpuNode("db", demandType.databaseCpuWorkMicro, false),
			netNode(id, demandType, false),
			diskNode("db", demandType, false),
		],
	};
}

function paymentGraph(demandType: DemandType): CompiledDemandGraph {
	return {
		graph: {
			roots: ["payment"],
			nodes: [
				node("payment", 0, 1),
				node("app", 0, 1),
				node("gateway", 0, 1),
				node("record", 0, 1),
				node("email", 0, 1),
			],
			edges: [
				edge("payment", "app", "required"),
				edge("payment", "gateway", "required"),
				edge("payment", "record", "required"),
				edge("payment", "email", "optional"),
			],
		},
		nodeWork: [
			cpuNode("app", demandType.applicationCpuWorkMicro, false),
			netNode("gateway", demandType, false),
			cpuNode("record", demandType.databaseCpuWorkMicro, false),
			diskNode("record", demandType, false),
			{
				nodeId: "email",
				dimension: "cpuWork",
				amountPerRequest: 2,
				gpuWorkPerRequest: 0,
				gpuMemoryMiB: 0,
				optional: true,
			},
		],
	};
}

function workerOnly(
	id: DemandTypeId,
	demandType: DemandType,
	dimension: WorkDimension,
): CompiledDemandGraph {
	const amount =
		dimension === "networkMiB"
			? Math.max(1, cpuPerRequest(demandType.networkMicroMiB))
			: Math.max(
					1,
					cpuPerRequest(demandType.applicationCpuWorkMicro + demandType.databaseCpuWorkMicro),
				);

	return {
		graph: {
			roots: [id],
			nodes: [node(id, 0, 1), node("worker", 0, 1)],
			edges: [edge(id, "worker", "required")],
		},
		nodeWork: [
			{
				nodeId: "worker",
				dimension,
				amountPerRequest: amount,
				gpuWorkPerRequest: 0,
				gpuMemoryMiB: 0,
				optional: false,
			},
			diskNode("worker", demandType, false),
		],
	};
}

function gpuWorker(id: DemandTypeId, demandType: DemandType): CompiledDemandGraph {
	return {
		graph: {
			roots: [id],
			nodes: [node(id, 0, 1), node("worker", 0, 1)],
			edges: [edge(id, "worker", "required")],
		},
		nodeWork: [
			{
				nodeId: "worker",
				dimension: "gpuWork",
				amountPerRequest: Math.max(1, cpuPerRequest(demandType.gpuWorkMicro)),
				gpuWorkPerRequest: Math.max(1, cpuPerRequest(demandType.gpuWorkMicro)),
				gpuMemoryMiB: demandType.gpuMemoryMiB,
				optional: false,
			},
		],
	};
}

function jobWithStorage(id: DemandTypeId, demandType: DemandType): CompiledDemandGraph {
	const gpu = cpuPerRequest(demandType.gpuWorkMicro);

	return {
		graph: {
			roots: [id],
			nodes: [node(id, 0, 1), node("worker", 0, 1), node("storage", 0, 1)],
			edges: [edge(id, "worker", "required"), edge("worker", "storage", "required")],
		},
		nodeWork: [
			{
				nodeId: "worker",
				dimension: gpu > 0 ? "gpuWork" : "cpuWork",
				amountPerRequest: Math.max(
					1,
					gpu > 0 ? gpu : cpuPerRequest(demandType.applicationCpuWorkMicro),
				),
				gpuWorkPerRequest: gpu,
				gpuMemoryMiB: demandType.gpuMemoryMiB,
				optional: false,
			},
			diskNode("storage", demandType, false),
		],
	};
}

function cpuNode(nodeId: string, micro: number, optional: boolean): CompiledNodeWork {
	return {
		nodeId,
		dimension: "cpuWork",
		amountPerRequest: Math.max(1, cpuPerRequest(micro)),
		gpuWorkPerRequest: 0,
		gpuMemoryMiB: 0,
		optional,
	};
}

function netNode(nodeId: string, demandType: DemandType, optional: boolean): CompiledNodeWork {
	const amount = cpuPerRequest(demandType.networkMicroMiB);

	if (amount <= 0) {
		return {
			nodeId,
			dimension: "networkMiB",
			amountPerRequest: 0,
			gpuWorkPerRequest: 0,
			gpuMemoryMiB: 0,
			optional,
		};
	}

	return {
		nodeId,
		dimension: "networkMiB",
		amountPerRequest: amount,
		gpuWorkPerRequest: 0,
		gpuMemoryMiB: 0,
		optional,
	};
}

function diskNode(nodeId: string, demandType: DemandType, optional: boolean): CompiledNodeWork {
	if (demandType.storageOperations <= 0) {
		return {
			nodeId,
			dimension: "diskOps",
			amountPerRequest: 0,
			gpuWorkPerRequest: 0,
			gpuMemoryMiB: 0,
			optional,
		};
	}

	return {
		nodeId,
		dimension: "diskOps",
		amountPerRequest: demandType.storageOperations,
		gpuWorkPerRequest: 0,
		gpuMemoryMiB: 0,
		optional,
	};
}

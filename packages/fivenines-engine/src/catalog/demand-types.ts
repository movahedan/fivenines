export type DemandWaitPolicy = "interactive" | "queued" | "continuous" | "job";
export type DemandRelease = "v1" | "expansion";

export const DEMAND_COST_MICRO = 1_000_000;

export interface DemandType {
	readonly id: string;
	readonly waitPolicy: DemandWaitPolicy;
	readonly release: DemandRelease;
	readonly applicationCpuWorkMicro: number;
	readonly databaseCpuWorkMicro: number;
	readonly gpuWorkMicro: number;
	readonly networkMicroMiB: number;
	readonly storageOperations: number;
	readonly workingMemoryMicroMiB: number;
	readonly maxCpuParallelism: number;
	readonly gpuMemoryMiB: number;
	readonly queueKiB: number;
}

function micro(value: number): number {
	return Math.round(value * DEMAND_COST_MICRO);
}

function demandType(
	id: string,
	waitPolicy: DemandWaitPolicy,
	release: DemandRelease,
	applicationCpuWork: number,
	databaseCpuWork: number,
	gpuWork: number,
	networkMiB: number,
	storageOperations: number,
	workingMemoryMiB: number,
	maxCpuParallelism: number,
	gpuMemoryMiB: number,
	queueKiB: number,
): DemandType {
	return {
		id,
		waitPolicy,
		release,
		applicationCpuWorkMicro: micro(applicationCpuWork),
		databaseCpuWorkMicro: micro(databaseCpuWork),
		gpuWorkMicro: micro(gpuWork),
		networkMicroMiB: micro(networkMiB),
		storageOperations,
		workingMemoryMicroMiB: micro(workingMemoryMiB),
		maxCpuParallelism,
		gpuMemoryMiB,
		queueKiB,
	};
}

export const DEMAND_TYPES = {
	"page-read": demandType("page-read", "interactive", "v1", 0.6, 0.4, 0, 0.05, 2, 1, 1, 0, 4),
	"record-write": demandType("record-write", "interactive", "v1", 0.8, 1.2, 0, 0.02, 4, 2, 1, 0, 4),
	payment: demandType("payment", "interactive", "v1", 1.2, 1.8, 0, 0.02, 6, 2, 1, 0, 8),
	"chat-message": demandType(
		"chat-message",
		"interactive",
		"v1",
		0.8,
		0.2,
		0,
		0.004,
		1,
		1,
		1,
		0,
		2,
	),
	"email-message": demandType("email-message", "queued", "v1", 2, 0, 0, 0.1, 3, 1, 2, 0, 64),
	"mailbox-read": demandType("mailbox-read", "interactive", "v1", 1, 0.5, 0, 0.1, 2, 2, 1, 0, 8),
	"search-query": demandType(
		"search-query",
		"interactive",
		"expansion",
		2,
		0,
		0,
		0.04,
		3,
		8,
		1,
		0,
		8,
	),
	"dns-query": demandType("dns-query", "interactive", "v1", 0.05, 0, 0, 0.0005, 0, 0.125, 1, 0, 1),
	"video-minute": demandType("video-minute", "continuous", "v1", 0.5, 0, 0, 30, 4, 1, 1, 0, 2),
	"live-minute": demandType("live-minute", "continuous", "v1", 1, 0, 0, 30, 0, 2, 1, 0, 2),
	"call-minute": demandType("call-minute", "continuous", "expansion", 2, 0, 0, 12, 0, 4, 1, 0, 2),
	"game-session-minute": demandType(
		"game-session-minute",
		"continuous",
		"expansion",
		6,
		0,
		0,
		0.5,
		0,
		4,
		1,
		0,
		2,
	),
	"inference-cpu": demandType("inference-cpu", "interactive", "v1", 20, 0, 0, 0.02, 1, 32, 4, 0, 8),
	"inference-gpu": demandType(
		"inference-gpu",
		"interactive",
		"v1",
		1,
		0,
		25,
		0.02,
		1,
		8,
		1,
		4096,
		8,
	),
	"event-ingest": demandType(
		"event-ingest",
		"queued",
		"expansion",
		0.3,
		0,
		0,
		0.005,
		1,
		0.5,
		1,
		0,
		8,
	),
	"analytics-job": demandType(
		"analytics-job",
		"job",
		"expansion",
		16000,
		0,
		0,
		128,
		20000,
		2048,
		4,
		0,
		16,
	),
	"transcode-job": demandType(
		"transcode-job",
		"job",
		"v1",
		32000,
		0,
		0,
		1024,
		10000,
		1024,
		8,
		0,
		16,
	),
	"batch-job": demandType("batch-job", "job", "v1", 48000, 0, 0, 128, 10000, 2048, 8, 0, 16),
	"training-job": demandType(
		"training-job",
		"job",
		"expansion",
		4000,
		0,
		80000,
		1024,
		20000,
		4096,
		8,
		8192,
		16,
	),
	"distributed-training-job": demandType(
		"distributed-training-job",
		"job",
		"expansion",
		16000,
		0,
		320000,
		8192,
		40000,
		8192,
		16,
		16384,
		16,
	),
} as const satisfies Record<string, DemandType>;

export type DemandTypeId = keyof typeof DEMAND_TYPES;

export function demandTypeById(id: string): DemandType {
	if (!Object.hasOwn(DEMAND_TYPES, id)) {
		throw new Error(`unknown demand type: ${id}`);
	}

	return DEMAND_TYPES[id as DemandTypeId];
}

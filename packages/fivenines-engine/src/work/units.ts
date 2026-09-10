export const THROUGHPUT_DIMENSIONS = ["cpuWork", "gpuWork", "diskOps", "networkMiB"] as const;

export const OCCUPANCY_DIMENSIONS = [
	"residentMemoryMiB",
	"queuedMemoryMiB",
	"diskCapacityMiB",
] as const;

export const WORK_DIMENSIONS = [...THROUGHPUT_DIMENSIONS, ...OCCUPANCY_DIMENSIONS] as const;

export type ThroughputDimension = (typeof THROUGHPUT_DIMENSIONS)[number];
export type OccupancyDimension = (typeof OCCUPANCY_DIMENSIONS)[number];
export type WorkDimension = (typeof WORK_DIMENSIONS)[number];

export const WORK_UNITS: Record<WorkDimension, string> = {
	cpuWork: "CPU work / tick",
	gpuWork: "GPU work / tick",
	diskOps: "disk operations / tick",
	networkMiB: "network MiB / tick",
	residentMemoryMiB: "resident MiB",
	queuedMemoryMiB: "queued MiB",
	diskCapacityMiB: "disk capacity MiB",
};

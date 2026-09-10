import { units } from "@packages/shared/units";

import type { WorkDimension } from "../work/units";

export const NETWORK_MIB_FROM_MBPS_SECONDS_PER_TICK = 3600;
export const NETWORK_MIB_FROM_MBPS_BITS_PER_BYTE = 8;
export const NETWORK_MIB_FROM_MBPS_KIB = 1024;

export interface HardwareDesignAudit {
	cores: number;
	coreFactor: number;
	ramMiB: number;
	diskGiB: number;
	networkMbps: number;
	diskMiBps: number;
	iops: number;
	gpuCount: number;
	gpuWorkPerDeviceHour: number;
	gpuMemoryMiBPerDevice: number;
	purchase: number;
	dailyRent: number;
	maintenancePerHour: number;
	idlePowerPerHour: number;
	maxPowerPerHour: number;
}

export interface RuntimeHardware {
	id: string;
	cpuWork: number;
	gpuWork: number;
	diskOps: number;
	networkMiB: number;
	residentMemoryMiB: number;
	queuedMemoryMiB: number;
	diskCapacityMiB: number;
	gpuCount: number;
	design: HardwareDesignAudit;
}

export const HARDWARE_WORK_FIELDS = [
	"cpuWork",
	"gpuWork",
	"diskOps",
	"networkMiB",
	"residentMemoryMiB",
	"queuedMemoryMiB",
	"diskCapacityMiB",
] as const satisfies readonly WorkDimension[];

export function networkMiBFromMbps(networkMbps: number): number {
	return units.asNonNegativeInteger(
		Math.round(
			(networkMbps * NETWORK_MIB_FROM_MBPS_SECONDS_PER_TICK) /
				NETWORK_MIB_FROM_MBPS_BITS_PER_BYTE /
				NETWORK_MIB_FROM_MBPS_KIB,
		),
		"networkMiB",
	);
}

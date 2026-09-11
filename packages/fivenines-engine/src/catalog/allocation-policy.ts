export const ALLOCATION_POLICY = {
	queuedMemoryReservePercent: 10,
	durableDiskReservePercent: 5,
	appointmentTemplateId: "appointment-site",
} as const;

export function queuedMemoryMiB(memoryMiB: number): number {
	return Math.floor((memoryMiB * ALLOCATION_POLICY.queuedMemoryReservePercent) / 100);
}

export function queuedMemoryCapacityKiB(memoryMiB: number): number {
	return queuedMemoryMiB(memoryMiB) * 1024;
}

export function durableDiskReserveMiB(diskCapacityMiB: number): number {
	return Math.floor((diskCapacityMiB * ALLOCATION_POLICY.durableDiskReservePercent) / 100);
}

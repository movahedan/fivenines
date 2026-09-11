import type { Server } from "../server";

export const TRANSFER_POLICY = {
	networkHoursAtFullLink: 1,
	diskHoursAtFullIops: 2,
} as const;

export function transferPayload(source: Server): {
	remainingNetworkMiB: number;
	remainingDiskOps: number;
} {
	return {
		remainingNetworkMiB: Math.max(
			1,
			source.networkBytesPerHour * TRANSFER_POLICY.networkHoursAtFullLink,
		),
		remainingDiskOps: Math.max(1, Math.floor(source.diskOps / TRANSFER_POLICY.diskHoursAtFullIops)),
	};
}

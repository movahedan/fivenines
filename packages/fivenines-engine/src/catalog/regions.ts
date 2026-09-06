import { PLACEMENT_POLICY } from "./placement-policy";

const BY_ID = {
	"utc-8": { offsetHours: -8 },
	"utc-5": { offsetHours: -5 },
	"utc+0": { offsetHours: 0 },
	"utc+1": { offsetHours: 1 },
	"utc+9": { offsetHours: 9 },
} as const;

export type RegionId = keyof typeof BY_ID;

function isRegionId(value: string): value is RegionId {
	return Object.hasOwn(BY_ID, value);
}

function parseRegionId(value: string): RegionId {
	if (!isRegionId(value)) {
		throw new Error(`unknown region: ${value}`);
	}

	return value;
}

function offsetHoursFor(region: RegionId): number {
	return BY_ID[region].offsetHours;
}

function offsetDeltaHours(from: RegionId, to: RegionId): number {
	return Math.abs(offsetHoursFor(from) - offsetHoursFor(to));
}

function remoteLatencyMs(from: RegionId, to: RegionId): number {
	return offsetDeltaHours(from, to) * PLACEMENT_POLICY.latencyMsPerOffsetHour;
}

export const regions = {
	byId: BY_ID,
	isRegionId,
	parseRegionId,
	offsetHoursFor,
	offsetDeltaHours,
	remoteLatencyMs,
};

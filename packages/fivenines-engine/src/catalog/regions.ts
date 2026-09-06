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

export const regions = {
	byId: BY_ID,
	isRegionId,
	parseRegionId,
	offsetHoursFor,
};

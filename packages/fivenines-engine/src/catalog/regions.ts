export const REGIONS = {
	"utc-8": { offsetHours: -8 },
	"utc-5": { offsetHours: -5 },
	"utc+0": { offsetHours: 0 },
	"utc+1": { offsetHours: 1 },
	"utc+9": { offsetHours: 9 },
} as const;

export type RegionId = keyof typeof REGIONS;

export function isRegionId(value: string): value is RegionId {
	return Object.hasOwn(REGIONS, value);
}

export function parseRegionId(value: string): RegionId {
	if (!isRegionId(value)) {
		throw new Error(`unknown region: ${value}`);
	}

	return value;
}

export function offsetHoursFor(region: RegionId): number {
	return REGIONS[region].offsetHours;
}

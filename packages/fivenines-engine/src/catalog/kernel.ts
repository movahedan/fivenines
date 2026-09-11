export const BRONZE = {
	id: "bronze",
	computeUnitsPerHour: 1000,
	networkBytesPerHour: 1_000_000,
	memoryMiB: 4096,
	baseMemoryMiB: 256,
	gpuCount: 0,
	gpuWork: 0,
	gpuMemoryMiB: 0,
	diskCapacityMiB: 65_536,
	diskOps: 7_200_000,
} as const;

export const SILVER = {
	id: "silver",
	computeUnitsPerHour: 2000,
	networkBytesPerHour: 2_000_000,
	memoryMiB: 8192,
	baseMemoryMiB: 256,
	gpuCount: 0,
	gpuWork: 0,
	gpuMemoryMiB: 0,
	diskCapacityMiB: 262_144,
	diskOps: 28_800_000,
} as const;

export const GOLD = {
	id: "gold",
	computeUnitsPerHour: 4000,
	networkBytesPerHour: 4_000_000,
	memoryMiB: 16_384,
	baseMemoryMiB: 256,
	gpuCount: 0,
	gpuWork: 0,
	gpuMemoryMiB: 0,
	diskCapacityMiB: 524_288,
	diskOps: 57_600_000,
} as const;

export const PLATINUM = {
	id: "platinum",
	computeUnitsPerHour: 8000,
	networkBytesPerHour: 8_000_000,
	memoryMiB: 32_768,
	baseMemoryMiB: 256,
	gpuCount: 0,
	gpuWork: 0,
	gpuMemoryMiB: 0,
	diskCapacityMiB: 524_288,
	diskOps: 72_000_000,
} as const;

export const DIAMOND = {
	id: "diamond",
	computeUnitsPerHour: 16_000,
	networkBytesPerHour: 16_000_000,
	memoryMiB: 65_536,
	baseMemoryMiB: 256,
	gpuCount: 0,
	gpuWork: 0,
	gpuMemoryMiB: 0,
	diskCapacityMiB: 1_048_576,
	diskOps: 144_000_000,
} as const;

export const THIN_RAM = {
	id: "thin-ram",
	computeUnitsPerHour: 16_000,
	networkBytesPerHour: 16_000_000,
	memoryMiB: 32,
	baseMemoryMiB: 1,
	gpuCount: 0,
	gpuWork: 0,
	gpuMemoryMiB: 0,
	diskCapacityMiB: 1_048_576,
	diskOps: 144_000_000,
} as const;

export const SERVER_CATALOG = {
	bronze: BRONZE,
	silver: SILVER,
	gold: GOLD,
	platinum: PLATINUM,
	diamond: DIAMOND,
	"thin-ram": THIN_RAM,
} as const;

export type ServerCatalogId = keyof typeof SERVER_CATALOG;

export const SERVER_TIER_LABEL: Record<ServerCatalogId, string> = {
	bronze: "Bronze",
	silver: "Silver",
	gold: "Gold",
	platinum: "Platinum",
	diamond: "Diamond",
	"thin-ram": "Thin RAM",
};

export const SERVER_CATALOG_IDS: ServerCatalogId[] = [
	"bronze",
	"silver",
	"gold",
	"platinum",
	"diamond",
	"thin-ram",
];

export const BASE_LATENCY_MS = 20;
export const LATENCY_MS_PER_UTIL_PERCENT = 1;

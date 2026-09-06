export const BRONZE = {
	id: "bronze",
	computeUnitsPerHour: 1000,
	networkBytesPerHour: 1_000_000,
	memoryMiB: 4096,
	baseMemoryMiB: 256,
} as const;

export const SILVER = {
	id: "silver",
	computeUnitsPerHour: 2000,
	networkBytesPerHour: 2_000_000,
	memoryMiB: 8192,
	baseMemoryMiB: 256,
} as const;

export const GOLD = {
	id: "gold",
	computeUnitsPerHour: 4000,
	networkBytesPerHour: 4_000_000,
	memoryMiB: 16_384,
	baseMemoryMiB: 256,
} as const;

export const PLATINUM = {
	id: "platinum",
	computeUnitsPerHour: 8000,
	networkBytesPerHour: 8_000_000,
	memoryMiB: 32_768,
	baseMemoryMiB: 256,
} as const;

export const DIAMOND = {
	id: "diamond",
	computeUnitsPerHour: 16_000,
	networkBytesPerHour: 16_000_000,
	memoryMiB: 65_536,
	baseMemoryMiB: 256,
} as const;

export const THIN_RAM = {
	id: "thin-ram",
	computeUnitsPerHour: 16_000,
	networkBytesPerHour: 16_000_000,
	memoryMiB: 32,
	baseMemoryMiB: 1,
} as const;

export const SERVER_CATALOG = {
	[BRONZE.id]: BRONZE,
	[SILVER.id]: SILVER,
	[GOLD.id]: GOLD,
	[PLATINUM.id]: PLATINUM,
	[DIAMOND.id]: DIAMOND,
	[THIN_RAM.id]: THIN_RAM,
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

export const SERVER_CATALOG_IDS = Object.keys(SERVER_CATALOG) as ServerCatalogId[];

export const BASE_LATENCY_MS = 20;
export const LATENCY_MS_PER_UTIL_PERCENT = 1;

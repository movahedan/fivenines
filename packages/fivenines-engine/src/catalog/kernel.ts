export const BRONZE = {
	id: "bronze",
	cpuMillicores: 1000,
	memoryMiB: 512,
	millicoresPerRequest: 1,
} as const;

export const SILVER = {
	id: "silver",
	cpuMillicores: 2000,
	memoryMiB: 1024,
	millicoresPerRequest: 1,
} as const;

export const GOLD = {
	id: "gold",
	cpuMillicores: 4000,
	memoryMiB: 2048,
	millicoresPerRequest: 1,
} as const;

export const PLATINUM = {
	id: "platinum",
	cpuMillicores: 8000,
	memoryMiB: 4096,
	millicoresPerRequest: 1,
} as const;

export const DIAMOND = {
	id: "diamond",
	cpuMillicores: 16_000,
	memoryMiB: 8192,
	millicoresPerRequest: 1,
} as const;

export const SERVER_CATALOG = {
	[BRONZE.id]: BRONZE,
	[SILVER.id]: SILVER,
	[GOLD.id]: GOLD,
	[PLATINUM.id]: PLATINUM,
	[DIAMOND.id]: DIAMOND,
} as const;

export type ServerCatalogId = keyof typeof SERVER_CATALOG;

export const SERVER_TIER_LABEL: Record<ServerCatalogId, string> = {
	bronze: "Bronze",
	silver: "Silver",
	gold: "Gold",
	platinum: "Platinum",
	diamond: "Diamond",
};

export const SERVER_CATALOG_IDS = Object.keys(SERVER_CATALOG) as ServerCatalogId[];

export const BASE_LATENCY_MS = 20;
export const LATENCY_MS_PER_UTIL_PERCENT = 1;

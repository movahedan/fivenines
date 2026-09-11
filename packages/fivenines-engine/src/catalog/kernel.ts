const NO_GPU = {
	gpuCount: 0,
	gpuWork: 0,
	gpuMemoryMiB: 0,
} as const;

function withHostStocks<T extends { computeUnitsPerHour: number }>(
	sku: T,
	diskGiB: number,
	iops: number,
): T & typeof NO_GPU & { diskCapacityMiB: number; diskOps: number } {
	return {
		...sku,
		...NO_GPU,
		diskCapacityMiB: diskGiB * 1024,
		diskOps: iops * 3600,
	};
}

export const BRONZE = withHostStocks(
	{
		id: "bronze",
		computeUnitsPerHour: 1000,
		networkBytesPerHour: 1_000_000,
		memoryMiB: 4096,
		baseMemoryMiB: 256,
	},
	64,
	2000,
);

export const SILVER = withHostStocks(
	{
		id: "silver",
		computeUnitsPerHour: 2000,
		networkBytesPerHour: 2_000_000,
		memoryMiB: 8192,
		baseMemoryMiB: 256,
	},
	256,
	8000,
);

export const GOLD = withHostStocks(
	{
		id: "gold",
		computeUnitsPerHour: 4000,
		networkBytesPerHour: 4_000_000,
		memoryMiB: 16_384,
		baseMemoryMiB: 256,
	},
	512,
	16_000,
);

export const PLATINUM = withHostStocks(
	{
		id: "platinum",
		computeUnitsPerHour: 8000,
		networkBytesPerHour: 8_000_000,
		memoryMiB: 32_768,
		baseMemoryMiB: 256,
	},
	512,
	20_000,
);

export const DIAMOND = withHostStocks(
	{
		id: "diamond",
		computeUnitsPerHour: 16_000,
		networkBytesPerHour: 16_000_000,
		memoryMiB: 65_536,
		baseMemoryMiB: 256,
	},
	1024,
	40_000,
);

export const THIN_RAM = withHostStocks(
	{
		id: "thin-ram",
		computeUnitsPerHour: 16_000,
		networkBytesPerHour: 16_000_000,
		memoryMiB: 32,
		baseMemoryMiB: 1,
	},
	1024,
	40_000,
);

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

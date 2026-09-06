export const TINY = {
	id: "tiny",
	cpuMillicores: 1000,
	memoryMiB: 512,
	millicoresPerRequest: 1,
} as const;

export const SERVER_CATALOG = {
	[TINY.id]: TINY,
} as const;

export type ServerCatalogId = keyof typeof SERVER_CATALOG;

export const BASE_LATENCY_MS = 20;
export const LATENCY_MS_PER_UTIL_PERCENT = 1;

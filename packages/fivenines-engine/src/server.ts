import { units } from "@packages/shared/units";

import { SERVER_CATALOG, type ServerCatalogId } from "./catalog/kernel";
import { type RegionId, regions } from "./catalog/regions";
import type { ProjectCategory } from "./project";
import {
	cpuLoadFromSlices,
	EMPTY_SERVER_TICK_METRICS,
	measureServerTick,
	type ServerTickMetrics,
} from "./server.metrics";

export type { ServerTickMetrics } from "./server.metrics";

export interface ServerInitial {
	id: string;
	catalogId: ServerCatalogId;
	region: RegionId;
}

export interface DemandSlice {
	category: ProjectCategory;
	requests: number;
	sourceRegion: RegionId;
	remote: boolean;
}

export class Server {
	readonly id: string;
	readonly kind = "server" as const;
	readonly catalogId: ServerCatalogId;
	readonly region: RegionId;
	readonly computeUnitsPerHour: number;
	readonly networkBytesPerHour: number;
	readonly memoryMiB: number;
	readonly baseMemoryMiB: number;

	#slices: DemandSlice[] = [];
	#metrics: ServerTickMetrics = EMPTY_SERVER_TICK_METRICS;

	constructor(initial: ServerInitial) {
		const spec = SERVER_CATALOG[initial.catalogId];

		this.id = initial.id;
		this.catalogId = initial.catalogId;
		this.region = regions.parseRegionId(initial.region);
		this.computeUnitsPerHour = units.asNonNegativeInteger(
			spec.computeUnitsPerHour,
			"computeUnitsPerHour",
		);
		this.networkBytesPerHour = units.asNonNegativeInteger(
			spec.networkBytesPerHour,
			"networkBytesPerHour",
		);
		this.memoryMiB = units.asNonNegativeInteger(spec.memoryMiB, "memoryMiB");
		this.baseMemoryMiB = units.asNonNegativeInteger(spec.baseMemoryMiB, "baseMemoryMiB");
	}

	get metrics(): ServerTickMetrics {
		return this.#metrics;
	}

	get slices(): readonly DemandSlice[] {
		return this.#slices;
	}

	get remainingHeadroom(): number {
		return Math.max(0, this.computeUnitsPerHour - cpuLoadFromSlices(this.#slices));
	}

	resetDemand(): void {
		this.#slices = [];
	}

	assignSlice(slice: Omit<DemandSlice, "remote">): void {
		const requests = units.asNonNegativeInteger(slice.requests, "assignedRequests");

		if (requests === 0) {
			return;
		}

		this.#slices.push({
			category: slice.category,
			requests,
			sourceRegion: slice.sourceRegion,
			remote: slice.sourceRegion !== this.region,
		});
	}

	tick(): ServerTickMetrics {
		this.#metrics = measureServerTick(this.#slices, {
			computeUnitsPerHour: this.computeUnitsPerHour,
			networkBytesPerHour: this.networkBytesPerHour,
			memoryMiB: this.memoryMiB,
			baseMemoryMiB: this.baseMemoryMiB,
			region: this.region,
		});

		return this.#metrics;
	}
}

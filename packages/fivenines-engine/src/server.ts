import { units } from "@packages/shared/units";

import { SKU_ECONOMY } from "./catalog/economy-policy";
import {
	MONITORING_DISCOVERY_HOURS,
	MONITORING_RAM_MIB,
	OUTAGE_DEGRADED_HOURS,
	OUTAGE_DISCOVERY_DELAY_HOURS,
	OUTAGE_ONSET_PPM,
} from "./catalog/incident-policy";
import { SERVER_CATALOG, type ServerCatalogId } from "./catalog/kernel";
import { type RegionId, regions } from "./catalog/regions";
import {
	cpuLoadFromSlices,
	EMPTY_SERVER_TICK_METRICS,
	measureServerTick,
	type ServerDemandSlice,
	type ServerTickMetrics,
} from "./server.metrics";
import type { RandomSource } from "./traffic/random-source";

export type { ServerTickMetrics } from "./server.metrics";

export type ServerHealth = "ok" | "degraded" | "unavailable";

export type ServerTenure =
	| { kind: "owned"; purchaseCents: number }
	| { kind: "leased"; hourlyCents: number };

export interface ServerInitial {
	id: string;
	catalogId: ServerCatalogId;
	region: RegionId;
	tenure?: ServerTenure;
	health?: ServerHealth;
	monitoring?: boolean;
	outageDiscovered?: boolean;
}

export interface DemandSlice extends ServerDemandSlice {
	remote: boolean;
}

export class Server {
	readonly id: string;
	readonly kind = "server" as const;
	readonly catalogId: ServerCatalogId;
	readonly region: RegionId;
	readonly tenure: ServerTenure;
	readonly computeUnitsPerHour: number;
	readonly networkBytesPerHour: number;
	readonly memoryMiB: number;
	readonly baseMemoryMiB: number;

	#health: ServerHealth;
	#monitoring: boolean;
	#outageHours: number;
	#outageDiscovered: boolean;
	#slices: DemandSlice[] = [];
	#metrics: ServerTickMetrics = EMPTY_SERVER_TICK_METRICS;

	constructor(initial: ServerInitial) {
		const spec = SERVER_CATALOG[initial.catalogId];

		this.id = initial.id;
		this.catalogId = initial.catalogId;
		this.region = regions.parseRegionId(initial.region);
		this.tenure = parseTenure(initial.catalogId, initial.tenure);
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
		this.#health = initial.health ?? "ok";
		this.#monitoring = initial.monitoring ?? false;
		this.#outageHours = 0;
		this.#outageDiscovered = this.#health === "ok" ? false : (initial.outageDiscovered ?? false);
	}

	get health(): ServerHealth {
		return this.#health;
	}

	get monitoring(): boolean {
		return this.#monitoring;
	}

	get outageHours(): number {
		return this.#outageHours;
	}

	get outageDiscovered(): boolean {
		return this.#outageDiscovered;
	}

	get effectiveComputeUnitsPerHour(): number {
		if (this.#health === "unavailable") {
			return 0;
		}

		if (this.#health === "degraded") {
			return Math.floor(this.computeUnitsPerHour / 2);
		}

		return this.computeUnitsPerHour;
	}

	get metrics(): ServerTickMetrics {
		return this.#metrics;
	}

	get slices(): readonly DemandSlice[] {
		return this.#slices;
	}

	get remainingHeadroom(): number {
		return Math.max(0, this.effectiveComputeUnitsPerHour - cpuLoadFromSlices(this.#slices));
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
			projectId: slice.projectId,
			remote: slice.sourceRegion !== this.region,
		});
	}

	tick(): ServerTickMetrics {
		this.#metrics = measureServerTick(this.#slices, {
			computeUnitsPerHour: this.effectiveComputeUnitsPerHour,
			networkBytesPerHour: this.networkBytesPerHour,
			memoryMiB: this.memoryMiB,
			baseMemoryMiB: this.baseMemoryMiB + (this.#monitoring ? MONITORING_RAM_MIB : 0),
			region: this.region,
		});

		return this.#metrics;
	}

	startOutage(): void {
		if (this.#health !== "ok") {
			throw new Error(`server is already in outage: ${this.id}`);
		}

		this.#health = "degraded";
		this.#outageHours = 0;
		this.#outageDiscovered = false;
	}

	repair(): void {
		if (this.#health === "ok") {
			throw new Error(`server is not in outage: ${this.id}`);
		}

		this.#health = "ok";
		this.#outageHours = 0;
		this.#outageDiscovered = false;
	}

	installMonitoring(): void {
		if (this.#monitoring) {
			throw new Error(`monitoring already installed: ${this.id}`);
		}

		this.#monitoring = true;
	}

	advanceIncidents(rollIncidents: boolean, random: RandomSource): void {
		if (this.#health !== "ok") {
			if (this.#health === "degraded" && this.#outageHours >= OUTAGE_DEGRADED_HOURS) {
				this.#health = "unavailable";
			}

			this.#discoverIfDue();
			return;
		}

		if (!rollIncidents) {
			return;
		}

		const onsetRoll = Math.floor(random.nextUnit() * 1_000_000);

		if (onsetRoll < OUTAGE_ONSET_PPM) {
			this.startOutage();
			this.#discoverIfDue();
		}
	}

	completeOutageHour(): void {
		if (this.#health !== "ok") {
			this.#outageHours += 1;
		}
	}

	#discoverIfDue(): void {
		if (this.#outageDiscovered || this.#health === "ok") {
			return;
		}

		if (this.#monitoring && this.#outageHours >= MONITORING_DISCOVERY_HOURS) {
			this.#outageDiscovered = true;
			return;
		}

		if (!this.#monitoring && this.#outageHours + 1 >= OUTAGE_DISCOVERY_DELAY_HOURS) {
			this.#outageDiscovered = true;
		}
	}
}

function parseTenure(catalogId: ServerCatalogId, tenure: ServerTenure | undefined): ServerTenure {
	const resolved =
		tenure ??
		({
			kind: "owned",
			purchaseCents: SKU_ECONOMY[catalogId].purchaseCents,
		} satisfies ServerTenure);

	if (resolved.kind === "owned") {
		return {
			kind: "owned",
			purchaseCents: units.asNonNegativeInteger(resolved.purchaseCents, "purchaseCents"),
		};
	}

	return {
		kind: "leased",
		hourlyCents: units.asNonNegativeInteger(resolved.hourlyCents, "hourlyCents"),
	};
}

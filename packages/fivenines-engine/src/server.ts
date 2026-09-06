import { units } from "@packages/utils/units";

import {
	BASE_LATENCY_MS,
	LATENCY_MS_PER_UTIL_PERCENT,
	SERVER_CATALOG,
	type ServerCatalogId,
} from "./catalog/kernel";

export interface ServerInitial {
	id: string;
	catalogId: ServerCatalogId;
}

export interface ServerTickMetrics {
	assignedRequests: number;
	handledRequests: number;
	droppedRequests: number;
	p95LatencyMs: number;
	utilization: number;
	errorPpm: number;
}

const EMPTY_METRICS: ServerTickMetrics = {
	assignedRequests: 0,
	handledRequests: 0,
	droppedRequests: 0,
	p95LatencyMs: BASE_LATENCY_MS,
	utilization: 0,
	errorPpm: 0,
};

export class Server {
	readonly id: string;
	readonly kind = "server" as const;
	readonly catalogId: ServerCatalogId;
	readonly cpuMillicores: number;
	readonly memoryMiB: number;
	readonly millicoresPerRequest: number;
	readonly requestCapacity: number;

	#assignedRequests = 0;
	#metrics: ServerTickMetrics = EMPTY_METRICS;

	constructor(initial: ServerInitial) {
		const spec = SERVER_CATALOG[initial.catalogId];

		this.id = initial.id;
		this.catalogId = initial.catalogId;
		this.cpuMillicores = units.asNonNegativeInteger(spec.cpuMillicores, "cpuMillicores");
		this.memoryMiB = units.asNonNegativeInteger(spec.memoryMiB, "memoryMiB");
		this.millicoresPerRequest = units.asNonNegativeInteger(
			spec.millicoresPerRequest,
			"millicoresPerRequest",
		);
		this.requestCapacity =
			this.millicoresPerRequest === 0
				? 0
				: Math.floor(this.cpuMillicores / this.millicoresPerRequest);
	}

	get metrics(): ServerTickMetrics {
		return this.#metrics;
	}

	assignDemand(requests: number): void {
		this.#assignedRequests = units.asNonNegativeInteger(requests, "assignedRequests");
	}

	tick(): ServerTickMetrics {
		const assignedRequests = this.#assignedRequests;
		const handledRequests = Math.min(assignedRequests, this.requestCapacity);
		const droppedRequests = assignedRequests - handledRequests;
		const utilization = units.ratioPercent(assignedRequests, this.requestCapacity);
		const p95LatencyMs = BASE_LATENCY_MS + utilization * LATENCY_MS_PER_UTIL_PERCENT;
		const errorPpm =
			assignedRequests === 0 ? 0 : Math.floor((droppedRequests * 1_000_000) / assignedRequests);

		this.#metrics = {
			assignedRequests,
			handledRequests,
			droppedRequests,
			p95LatencyMs,
			utilization,
			errorPpm,
		};

		return this.#metrics;
	}
}

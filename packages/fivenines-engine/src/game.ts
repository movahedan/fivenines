import { ids } from "@packages/shared/ids";
import { units } from "@packages/shared/units";

import { Customer, type CustomerInitial } from "./customer";
import { assignDemandByCpuCap } from "./demand";
import {
	type AssetInitial,
	applyCommand,
	createAsset,
	type EngineCommand,
	type GameAsset,
} from "./game.utils";
import type { Server } from "./server";
import { MathRandomSource, type RandomSource } from "./traffic/random-source";

export type { AssetInitial, EngineCommand, GameAsset } from "./game.utils";

export interface GameOptions {
	random?: RandomSource;
}

export interface GameInitial {
	customers: readonly CustomerInitial[];
	assets: readonly AssetInitial[];
}

export interface GameTickMetrics {
	handledRequests: number;
	droppedRequests: number;
	p95LatencyMs: number;
	utilization: number;
	errorPpm: number;
}

const EMPTY_METRICS: GameTickMetrics = {
	handledRequests: 0,
	droppedRequests: 0,
	p95LatencyMs: 0,
	utilization: 0,
	errorPpm: 0,
};

export class Game {
	#customers: Customer[];
	#assets: GameAsset[];
	#hourIndex = 0;
	#random: RandomSource;

	#metrics: GameTickMetrics = EMPTY_METRICS;
	#serversById: ReadonlyMap<string, Server> = new Map();

	constructor(initial: GameInitial, options?: GameOptions) {
		const customerIds = initial.customers.map((customer) => customer.id);
		const projectIds = initial.customers.flatMap((customer) =>
			customer.projects.map((project) => project.id),
		);
		const assetIds = initial.assets.map((asset) => asset.id);

		ids.assertUnique(customerIds, "customer");
		ids.assertUnique(projectIds, "project");
		ids.assertUnique(assetIds, "asset");

		this.#customers = initial.customers.map((customer) => new Customer(customer));
		this.#assets = initial.assets.map((asset) => createAsset(asset));
		this.#random = options?.random ?? new MathRandomSource();
		this.#syncDerivedState();
	}

	get customers(): readonly Customer[] {
		return this.#customers;
	}

	get assets(): readonly GameAsset[] {
		return this.#assets;
	}

	get servers(): readonly Server[] {
		return [...this.#serversById.values()];
	}

	get metrics(): GameTickMetrics {
		return this.#metrics;
	}

	get hourIndex(): number {
		return this.#hourIndex;
	}

	get hourOfDay(): number {
		return this.#hourIndex % 24;
	}

	get dayIndex(): number {
		return Math.floor(this.#hourIndex / 24);
	}

	dispatch(command: EngineCommand): Game {
		const next = applyCommand(
			{
				customers: this.#customers,
				assets: this.#assets,
			},
			command,
		);

		this.#customers = [...next.customers];
		this.#assets = [...next.assets];
		this.#syncDerivedState();

		return this;
	}

	tick(): Game {
		for (const server of this.#serversById.values()) {
			server.assignDemand(0);
		}

		let totalDemand = 0;

		for (const customer of this.customers) {
			for (const project of customer.projects) {
				totalDemand += project.tick(this.#hourIndex, this.#random);
			}
		}

		const servers = [...this.#serversById.values()];
		let unroutableDemand = 0;

		if (totalDemand > 0) {
			if (servers.length === 0) {
				unroutableDemand = totalDemand;
			} else {
				assignDemandByCpuCap(servers, totalDemand);
			}
		}

		for (const server of this.#serversById.values()) {
			server.tick();
		}

		this.#metrics = rollUp(servers, totalDemand, unroutableDemand);
		this.#hourIndex += 1;

		return this;
	}

	#syncDerivedState(): void {
		const serversById = new Map<string, Server>();

		for (const asset of this.#assets) {
			serversById.set(asset.id, asset);
		}

		this.#serversById = serversById;
	}
}

function rollUp(
	servers: readonly Server[],
	demandRequests: number,
	unroutableDemand: number,
): GameTickMetrics {
	if (servers.length === 0) {
		return {
			handledRequests: 0,
			droppedRequests: unroutableDemand,
			p95LatencyMs: 0,
			utilization: 0,
			errorPpm: units.partsPerMillion(unroutableDemand, demandRequests),
		};
	}

	let handledRequests = 0;
	let droppedRequests = unroutableDemand;
	let p95LatencyMs = 0;
	let utilization = 0;

	for (const server of servers) {
		const snapshot = server.metrics;

		handledRequests += snapshot.handledRequests;
		droppedRequests += snapshot.droppedRequests;
		p95LatencyMs = Math.max(p95LatencyMs, snapshot.p95LatencyMs);
		utilization = Math.max(utilization, snapshot.utilization);
	}

	return {
		handledRequests,
		droppedRequests,
		p95LatencyMs,
		utilization,
		errorPpm: units.partsPerMillion(droppedRequests, demandRequests),
	};
}

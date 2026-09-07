import { ids } from "@packages/shared/ids";

import { Customer, type CustomerInitial } from "./customer";
import { placeProjectDemand } from "./demand";
import { EMPTY_GAME_TICK_METRICS, type GameTickMetrics, measureGameTick } from "./game.metrics";
import {
	type AssetInitial,
	applyCommand,
	createAsset,
	type EngineCommand,
	type GameAsset,
} from "./game.utils";
import type { Server } from "./server";
import { MathRandomSource, type RandomSource } from "./traffic/random-source";

export type { GameTickMetrics } from "./game.metrics";
export type { AssetInitial, EngineCommand, GameAsset } from "./game.utils";

export interface GameOptions {
	random?: RandomSource;
}

export interface GameInitial {
	customers: readonly CustomerInitial[];
	assets: readonly AssetInitial[];
}

export class Game {
	#customers: Customer[];
	#assets: GameAsset[];
	#hourIndex = 0;
	#random: RandomSource;

	#metrics: GameTickMetrics = EMPTY_GAME_TICK_METRICS;
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
			server.resetDemand();
		}

		let totalDemand = 0;
		let unroutableDemand = 0;
		const servers = [...this.#serversById.values()];

		for (const customer of this.customers) {
			for (const project of customer.projects) {
				const demand = project.tick(this.#hourIndex, this.#random);

				totalDemand += demand;

				if (demand === 0) {
					continue;
				}

				if (servers.length === 0) {
					unroutableDemand += demand;
					continue;
				}

				unroutableDemand += placeProjectDemand(servers, demand, project.region, project.category);
			}
		}

		for (const server of this.#serversById.values()) {
			server.tick();
		}

		this.#metrics = measureGameTick(
			servers.map((server) => server.metrics),
			totalDemand,
			unroutableDemand,
		);
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

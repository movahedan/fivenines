import { ids } from "@packages/shared/ids";
import { units } from "@packages/shared/units";

import { DEBT_LIMIT_CENTS, STARTING_CASH_CENTS } from "./catalog/economy-policy";
import { Customer, type CustomerInitial } from "./customer";
import { placeProjectDemand } from "./demand";
import { accrueServedPayg, closeBillingPeriodIfDue } from "./game.commercial";
import {
	EMPTY_GAME_OPEX,
	type GameFinanceSnapshot,
	type GameOpexTotals,
	measureGameOpex,
} from "./game.finance";
import { EMPTY_GAME_TICK_METRICS, type GameTickMetrics, measureGameTick } from "./game.metrics";
import { applyProjectSla } from "./game.sla";
import {
	type AssetInitial,
	applyCommand,
	createAsset,
	type EngineCommand,
	type GameAsset,
} from "./game.utils";
import type { Server } from "./server";
import { MathRandomSource, type RandomSource } from "./traffic/random-source";

export type { GameFinanceSnapshot } from "./game.finance";
export type { GameTickMetrics } from "./game.metrics";
export type { AssetInitial, EngineCommand, GameAsset } from "./game.utils";

export interface GameOptions {
	random?: RandomSource;
}

export interface GameInitial {
	customers: readonly CustomerInitial[];
	assets: readonly AssetInitial[];
	cashCents?: number;
	jailed?: boolean;
}

export class Game {
	#customers: Customer[];
	#assets: GameAsset[];
	#hourIndex = 0;
	#random: RandomSource;
	#cashCents: number;
	#jailed: boolean;
	#opex: GameOpexTotals = EMPTY_GAME_OPEX;

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
		this.#cashCents = units.asFiniteInteger(initial.cashCents ?? STARTING_CASH_CENTS, "cashCents");
		this.#jailed = initial.jailed ?? false;
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

	get cashCents(): number {
		return this.#cashCents;
	}

	get jailed(): boolean {
		return this.#jailed;
	}

	get finance(): GameFinanceSnapshot {
		return {
			cashCents: this.#cashCents,
			jailed: this.#jailed,
			opexCents: this.#opex.opexCents,
			maintenanceCents: this.#opex.maintenanceCents,
			powerCents: this.#opex.powerCents,
		};
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
				cashCents: this.#cashCents,
				jailed: this.#jailed,
			},
			command,
		);

		this.#customers = [...next.customers];
		this.#assets = [...next.assets];
		this.#cashCents = next.cashCents;
		this.#jailed = next.jailed;
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

				unroutableDemand += placeProjectDemand(
					servers,
					demand,
					project.region,
					project.category,
					project.id,
				);
			}
		}

		for (const server of this.#serversById.values()) {
			server.tick();
		}

		const projects = this.customers.flatMap((customer) => customer.projects);

		applyProjectSla(projects, servers);

		this.#metrics = measureGameTick(
			servers.map((server) => server.metrics),
			totalDemand,
			unroutableDemand,
		);

		this.#opex = measureGameOpex(servers);
		this.#cashCents -= this.#opex.opexCents;
		this.#cashCents += accrueServedPayg(projects);

		if (this.#cashCents <= -DEBT_LIMIT_CENTS) {
			this.#jailed = true;
		}

		this.#hourIndex += 1;
		this.#cashCents += closeBillingPeriodIfDue(projects, this.#hourIndex);

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

import { ids } from "@packages/shared/ids";
import { units } from "@packages/shared/units";

import { SETUP_WITHDRAWAL_REPUTATION_DELTA } from "./catalog/contract-policy";
import { DEBT_LIMIT_CENTS, STARTING_CASH_CENTS } from "./catalog/economy-policy";
import { Customer, type CustomerInitial } from "./customer";
import { placeProjectDemand } from "./demand";
import {
	accruePeriodPayg,
	closeBillingPeriodIfDue,
	settlePaygReceivableIfDue,
} from "./game.commercial";
import type { EngineEvent } from "./game.events";
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
	assertRoutesResolve,
	createAsset,
	type EngineCommand,
	type GameAsset,
	postCashDelta,
} from "./game.utils";
import { LearningBoard, type LearningSnapshot } from "./learning/board";
import { type LearningCatalogRow, learningCatalog } from "./learning/catalog-view";
import type { Project } from "./project";
import type { Server } from "./server";
import { spawnAcquaintanceIfDue } from "./setup-clock";
import { MathRandomSource, type RandomSource } from "./traffic/random-source";

export type { EngineEvent } from "./game.events";
export type { GameFinanceSnapshot } from "./game.finance";
export type { GameTickMetrics } from "./game.metrics";
export type { AssetInitial, EngineCommand, GameAsset } from "./game.utils";
export type { LearningSnapshot, LearningSubject } from "./learning/board";
export type { LearningCatalogRow, LearningRowStatus } from "./learning/catalog-view";

interface TickContext {
	hour: number;
	cash: number;
	events: EngineEvent[];
	rng: RandomSource;
}

interface PlacedDemand {
	readonly projects: readonly Project[];
	readonly totalDemand: number;
	readonly unroutableDemand: number;
}

export interface GameOptions {
	random?: RandomSource;
}

export interface GameInitial {
	customers: readonly CustomerInitial[];
	assets: readonly AssetInitial[];
	cashCents?: number;
	accountsReceivableCents?: number;
	jailed?: boolean;
}

export class Game {
	#customers: Customer[];
	#assets: GameAsset[];
	#hourIndex = 0;
	#random: RandomSource;
	#cashCents: number;
	#accountsReceivableCents: number;
	#jailed: boolean;
	#opex: GameOpexTotals = EMPTY_GAME_OPEX;
	#learning = new LearningBoard();
	#reputation = 0;
	#lastOfferResolveHour = 0;

	#metrics: GameTickMetrics = EMPTY_GAME_TICK_METRICS;
	#events: EngineEvent[] = [];
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
		this.#accountsReceivableCents = units.asNonNegativeInteger(
			initial.accountsReceivableCents ?? 0,
			"accountsReceivableCents",
		);
		this.#jailed = initial.jailed ?? false;
		this.#syncDerivedState();
		assertRoutesResolve(this.#customers, this.#assets);
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

	get accountsReceivableCents(): number {
		return this.#accountsReceivableCents;
	}

	get jailed(): boolean {
		return this.#jailed;
	}

	get finance(): GameFinanceSnapshot {
		return {
			cashCents: this.#cashCents,
			accountsReceivableCents: this.#accountsReceivableCents,
			jailed: this.#jailed,
			opexCents: this.#opex.opexCents,
			maintenanceCents: this.#opex.maintenanceCents,
			powerCents: this.#opex.powerCents,
			leaseCents: this.#opex.leaseCents,
		};
	}

	get events(): readonly EngineEvent[] {
		return this.#events;
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

	get learning(): LearningSnapshot {
		return this.#learning.snapshot();
	}

	get learningCatalog(): readonly LearningCatalogRow[] {
		return learningCatalog(this.#learning.snapshot(), this.#cashCents);
	}

	get reputation(): number {
		return this.#reputation;
	}

	dispatch(command: EngineCommand): Game {
		if (
			command.type === "enrollLearning" ||
			command.type === "pauseLearning" ||
			command.type === "resumeLearning" ||
			command.type === "cancelLearning"
		) {
			this.#dispatchLearning(command);

			return this;
		}
		const next = applyCommand(
			{
				customers: this.#customers,
				assets: this.#assets,
				cashCents: this.#cashCents,
				jailed: this.#jailed,
				hourIndex: this.#hourIndex,
			},
			command,
		);

		// Validate the candidate graph before touching any field, so a rejected
		// command leaves the game exactly as it was rather than half applied.
		assertRoutesResolve(next.customers, next.assets);

		this.#customers = [...next.customers];
		this.#assets = [...next.assets];
		this.#cashCents = next.cashCents;
		this.#jailed = next.jailed;

		if (
			command.type === "acceptProject" ||
			command.type === "declineProject" ||
			command.type === "cancelSetup"
		) {
			this.#lastOfferResolveHour = this.#hourIndex;
		}

		this.#syncDerivedState();

		return this;
	}

	tick(): Game {
		const ctx: TickContext = {
			hour: this.#hourIndex,
			cash: this.#cashCents,
			events: [],
			rng: this.#random,
		};
		const simulatedHour = ctx.hour;
		const cashBefore = ctx.cash;

		const previousWindowPpmByProjectId = new Map(
			this.customers.flatMap((customer) =>
				customer.projects.map(
					(project) => [project.id, project.metrics.windowAvailabilityPpm] as const,
				),
			),
		);

		this.#resetDemand();
		const placed = this.#placeDemand(ctx);
		this.#tickServerPhysics(ctx, simulatedHour);
		this.#attributeSla(ctx, placed.projects, simulatedHour, previousWindowPpmByProjectId);
		this.#chargeOpex(ctx, placed);
		this.#tickLearning(ctx, simulatedHour);
		this.#tickOperations(ctx);
		this.#accruePayg(placed.projects);
		this.#applyJail(ctx);

		ctx.hour += 1;
		this.#hourIndex = ctx.hour;

		this.#settleDailyPayg(ctx, simulatedHour);
		this.#tickContractCalendars(ctx);
		this.#spawnAcquaintanceOffers(ctx);
		this.#closeWeeks(ctx, placed.projects, simulatedHour);
		this.#emitCashLow(ctx, cashBefore, simulatedHour);

		this.#cashCents = ctx.cash;
		this.#events = ctx.events;

		return this;
	}

	#resetDemand(): void {
		for (const server of this.#serversById.values()) {
			server.resetDemand();
		}
	}

	#placeDemand(ctx: TickContext): PlacedDemand {
		let totalDemand = 0;
		let unroutableDemand = 0;

		for (const customer of this.customers) {
			for (const project of customer.projects) {
				const demand = project.tick(ctx.hour, ctx.rng);

				totalDemand += demand;

				if (demand === 0) {
					continue;
				}

				const route = project.route;
				const routedServer =
					route === undefined ? undefined : this.#serversById.get(route.serverId);

				if (routedServer === undefined) {
					unroutableDemand += demand;
					continue;
				}

				unroutableDemand += placeProjectDemand(
					routedServer,
					demand,
					project.region,
					project.category,
					project.id,
				);
			}
		}

		return {
			projects: this.customers.flatMap((customer) => customer.projects),
			totalDemand,
			unroutableDemand,
		};
	}

	#tickServerPhysics(ctx: TickContext, simulatedHour: number): void {
		const utilizationByServerId = new Map(
			[...this.#serversById.values()].map(
				(server) => [server.id, server.metrics.utilization] as const,
			),
		);

		for (const server of this.#serversById.values()) {
			server.tick();

			const previousUtilization = utilizationByServerId.get(server.id) ?? 0;

			if (previousUtilization < 100 && server.metrics.utilization >= 100) {
				ctx.events.push({
					type: "serverSaturated",
					hourIndex: simulatedHour,
					serverId: server.id,
				});
			}
		}
	}

	#attributeSla(
		ctx: TickContext,
		projects: readonly Project[],
		simulatedHour: number,
		previousWindowPpmByProjectId: ReadonlyMap<string, number | null>,
	): void {
		const servers = [...this.#serversById.values()];

		applyProjectSla(projects, servers);

		for (const project of projects) {
			const previousPpm = previousWindowPpmByProjectId.get(project.id) ?? null;
			const nextPpm = project.metrics.windowAvailabilityPpm;
			const targetPpm = project.commercial.targetPpm;
			const previousMeetingOrNull = previousPpm === null || previousPpm >= targetPpm;
			const previousBreached = previousPpm !== null && previousPpm < targetPpm;
			const nextBreached = nextPpm !== null && nextPpm < targetPpm;
			const nextMeeting = nextPpm !== null && nextPpm >= targetPpm;

			if (previousMeetingOrNull && nextBreached && nextPpm !== null) {
				ctx.events.push({
					type: "slaBreached",
					hourIndex: simulatedHour,
					projectId: project.id,
					windowPpm: nextPpm,
				});
			}

			if (previousBreached && nextMeeting && nextPpm !== null) {
				ctx.events.push({
					type: "slaRecovered",
					hourIndex: simulatedHour,
					projectId: project.id,
					windowPpm: nextPpm,
				});
			}
		}
	}

	#chargeOpex(ctx: TickContext, placed: PlacedDemand): void {
		const servers = [...this.#serversById.values()];

		this.#metrics = measureGameTick(
			servers.map((server) => server.metrics),
			placed.totalDemand,
			placed.unroutableDemand,
		);
		this.#opex = measureGameOpex(servers);
		ctx.cash = postCashDelta(ctx.cash, -this.#opex.opexCents);
	}

	#tickLearning(ctx: TickContext, simulatedHour: number): void {
		ctx.cash = postCashDelta(ctx.cash, this.#learning.tick(simulatedHour, ctx.cash));
	}

	#tickOperations(_ctx: TickContext): void {}

	#accruePayg(projects: readonly Project[]): void {
		this.#accountsReceivableCents += accruePeriodPayg(projects);
	}

	#applyJail(ctx: TickContext): void {
		if (ctx.cash <= -DEBT_LIMIT_CENTS) {
			this.#jailed = true;
		}
	}

	#settleDailyPayg(ctx: TickContext, simulatedHour: number): void {
		const settledPaygCents = settlePaygReceivableIfDue(ctx.hour, this.#accountsReceivableCents);

		ctx.cash = postCashDelta(ctx.cash, settledPaygCents);

		if (settledPaygCents > 0) {
			this.#accountsReceivableCents = 0;
			ctx.events.push({
				type: "paygSettled",
				hourIndex: simulatedHour,
				cents: settledPaygCents,
			});
		}
	}

	#tickContractCalendars(ctx: TickContext): void {
		const reputationForPatience = this.#reputation;
		let nextReputation = this.#reputation;

		this.#customers = this.#customers.map((customer) => {
			const projects = customer.projects.map((project) => {
				const ticked = project.tickCalendar(ctx.hour, {
					trust: customer.trust,
					reputation: reputationForPatience,
					hatred: customer.hatred,
				});

				ctx.cash = postCashDelta(ctx.cash, -ticked.refundCents);

				if (ticked.withdrawn) {
					nextReputation += SETUP_WITHDRAWAL_REPUTATION_DELTA;
					this.#lastOfferResolveHour = ctx.hour;
				}

				if (ticked.expired) {
					this.#lastOfferResolveHour = ctx.hour;
				}

				return ticked.project;
			});

			return customer.withProjects(projects);
		});

		this.#reputation = Math.min(100, Math.max(0, nextReputation));
	}

	#spawnAcquaintanceOffers(ctx: TickContext): void {
		const market = spawnAcquaintanceIfDue(this.#customers, ctx.hour, this.#lastOfferResolveHour);

		this.#customers = [...market.customers];
		this.#lastOfferResolveHour = market.lastOfferResolveHour;
	}

	#closeWeeks(ctx: TickContext, physicsProjects: readonly Project[], simulatedHour: number): void {
		const settlementCountById = new Map(
			physicsProjects.map((project) => [project.id, project.settlements.length] as const),
		);

		ctx.cash = postCashDelta(ctx.cash, closeBillingPeriodIfDue(physicsProjects, ctx.hour));

		for (const project of physicsProjects) {
			const previousCount = settlementCountById.get(project.id) ?? 0;
			const latest = project.settlements[project.settlements.length - 1];

			if (
				latest !== undefined &&
				project.settlements.length > previousCount &&
				latest.creditCents > 0
			) {
				ctx.events.push({
					type: "weeklyCreditCharged",
					hourIndex: simulatedHour,
					projectId: project.id,
					creditCents: latest.creditCents,
				});
			}
		}
	}

	#emitCashLow(ctx: TickContext, cashBefore: number, simulatedHour: number): void {
		if (cashBefore > 0 && ctx.cash <= 0) {
			ctx.events.push({
				type: "cashLow",
				hourIndex: simulatedHour,
				cashCents: ctx.cash,
			});
		}
	}

	#syncDerivedState(): void {
		const serversById = new Map<string, Server>();

		for (const asset of this.#assets) {
			serversById.set(asset.id, asset);
		}

		this.#serversById = serversById;
	}

	#dispatchLearning(command: EngineCommand): void {
		if (command.type === "enrollLearning") {
			if (this.#jailed) {
				throw new Error("cannot enrollLearning while jailed");
			}

			const tuitionCents = this.#learning.enroll(
				command.payload.subject,
				this.#hourIndex,
				this.#cashCents,
			);
			this.#cashCents = postCashDelta(this.#cashCents, -tuitionCents);
			return;
		}

		if (command.type === "pauseLearning") {
			this.#learning.pause(command.payload.enrollmentId, "voluntary");
			return;
		}

		if (command.type === "resumeLearning") {
			const tuitionCents = this.#learning.resume(
				command.payload.enrollmentId,
				this.#hourIndex,
				this.#cashCents,
			);
			this.#cashCents = postCashDelta(this.#cashCents, -tuitionCents);
			return;
		}

		if (command.type === "cancelLearning") {
			this.#learning.cancel(command.payload.enrollmentId);
		}
	}
}

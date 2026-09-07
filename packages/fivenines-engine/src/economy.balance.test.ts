import { describe, expect, it } from "bun:test";

import { BILLING_PERIOD_HOURS, commercialTermsForCategory } from "./catalog/commercial-policy";
import { SKU_ECONOMY, STARTING_CASH_CENTS } from "./catalog/economy-policy";
import type { ServerCatalogId } from "./catalog/kernel";
import { DEFAULT_REGION, type RegionId } from "./catalog/regions";
import { openingInitial } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./game";
import type { Project, ProjectCategory, ProjectInitial, ProjectStatus } from "./project";
import { FixedRandomSource } from "./traffic/random-source";

function allProjects(game: Game): Project[] {
	return game.customers.flatMap((customer) => [...customer.projects]);
}

function tickHours(game: Game, hours: number): void {
	for (let i = 0; i < hours; i++) {
		game.tick();
	}
}

function acceptAllOffered(game: Game): void {
	for (const project of allProjects(game)) {
		if (project.status === "offered") {
			game.dispatch({ type: "acceptProject", payload: { projectId: project.id } });
		}
	}
}

function buyAffordableServers(game: Game, serverType: ServerCatalogId, region: RegionId): void {
	const purchaseCents = SKU_ECONOMY[serverType].purchaseCents;

	while (!game.jailed && game.cashCents >= purchaseCents) {
		game.dispatch({ type: "buyServer", payload: { serverType, region } });
	}
}

function constantContract(
	id: string,
	estimatedRequestsPerHour: number,
	category: ProjectCategory,
	status: ProjectStatus,
): ProjectInitial {
	return {
		id,
		estimatedRequestsPerHour,
		status,
		demand: "constant",
		category,
		region: DEFAULT_REGION,
		campaignProne: false,
		commercial: commercialTermsForCategory(category),
	};
}

function emptyFleetWith(projects: readonly ProjectInitial[], cashCents?: number): GameInitial {
	return {
		customers: [{ id: "customer-1", projects }],
		assets: [],
		...(cashCents === undefined ? {} : { cashCents }),
	};
}

function buyThenNet(game: Game, serverType: ServerCatalogId, hours: number): number {
	game.dispatch({
		type: "buyServer",
		payload: { serverType, region: DEFAULT_REGION },
	});
	const cashAfterBuy = game.cashCents;
	tickHours(game, hours);

	return game.cashCents - cashAfterBuy;
}

describe("Game - economy balance", () => {
	it("earns a modest profit in 24 hours when one Bronze serves one low-risk constant SaaS contract", () => {
		const game = new Game(emptyFleetWith([constantContract("saas-1", 400, "saas", "served")]));
		game.dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: DEFAULT_REGION },
		});
		const cashAfterBuy = game.cashCents;

		tickHours(game, 24);

		const profitCents = game.cashCents - cashAfterBuy;

		expect(profitCents).toBeGreaterThan(0);
		expect(profitCents).toBeLessThan(Math.floor(SKU_ECONOMY.bronze.purchaseCents / 8));
	});

	it("takes at least 72 hours for a full Bronze SaaS box to recoup its purchase", () => {
		const game = new Game(emptyFleetWith([constantContract("saas-full", 1000, "saas", "served")]));
		game.dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: DEFAULT_REGION },
		});

		let hours = 0;
		while (game.cashCents < STARTING_CASH_CENTS && hours < 500) {
			game.tick();
			hours += 1;
		}

		expect(hours).toBeGreaterThanOrEqual(72);
		expect(hours).toBeLessThan(500);
		expect(game.cashCents).toBeGreaterThanOrEqual(STARTING_CASH_CENTS);
	});

	it("jails or drains cash within 168 hours when every Opening project is accepted onto one Bronze", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		game.dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: DEFAULT_REGION },
		});
		acceptAllOffered(game);
		tickHours(game, BILLING_PERIOD_HOURS);

		expect(game.jailed || game.cashCents < 0).toBe(true);
	});

	it("does not profit after a 168-hour close when every Opening project is accepted with an empty fleet", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		acceptAllOffered(game);
		tickHours(game, BILLING_PERIOD_HOURS);

		expect(game.cashCents).toBeLessThanOrEqual(STARTING_CASH_CENTS);
		expect(game.assets).toHaveLength(0);
	});

	it("nets worse over 48 hours when a Gold box serves a small load than a Bronze box does", () => {
		const hours = 48;
		const cashCents = 100_000;
		const smallLoad = [constantContract("small-1", 200, "portfolio", "served")];

		const bronzeNet = buyThenNet(new Game(emptyFleetWith(smallLoad, cashCents)), "bronze", hours);
		const goldNet = buyThenNet(new Game(emptyFleetWith(smallLoad, cashCents)), "gold", hours);

		expect(goldNet).toBeLessThan(bronzeNet);
	});

	it("survives 168 hours solvent when one Bronze serves only northwind-search", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		game.dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: DEFAULT_REGION },
		});
		game.dispatch({ type: "acceptProject", payload: { projectId: "northwind-search" } });
		tickHours(game, BILLING_PERIOD_HOURS);

		expect(game.jailed).toBe(false);
		expect(game.cashCents).toBeGreaterThan(0);
	});

	it("does not double starting cash in 24 hours when accepting all Opening projects and buying every affordable Bronze", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		acceptAllOffered(game);

		for (let hour = 0; hour < 24; hour++) {
			buyAffordableServers(game, "bronze", DEFAULT_REGION);
			game.tick();
		}

		expect(game.cashCents).toBeLessThan(STARTING_CASH_CENTS * 2);
	});

	it("stays solvent over a 168-hour close when two owned Bronzes serve globex-billing and initech-tps", () => {
		const cashAfterFleet = 8_000;
		const game = new Game(
			{
				...openingInitial,
				assets: [
					{ kind: "server", id: "server-1", catalogId: "bronze", region: DEFAULT_REGION },
					{ kind: "server", id: "server-2", catalogId: "bronze", region: DEFAULT_REGION },
				],
				cashCents: cashAfterFleet,
			},
			{ random: new FixedRandomSource(0.5) },
		);
		game.dispatch({ type: "acceptProject", payload: { projectId: "globex-billing" } });
		game.dispatch({ type: "acceptProject", payload: { projectId: "initech-tps" } });
		tickHours(game, BILLING_PERIOD_HOURS);

		expect(game.jailed).toBe(false);
		expect(game.cashCents).toBeGreaterThan(0);
	});
});

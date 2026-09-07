import { describe, expect, it } from "bun:test";

import {
	BILLING_PERIOD_HOURS,
	OPENING_COMMERCIAL_STUB,
	PAYG_ONLY_COMMERCIAL_STUB,
	SETTLEMENT_HISTORY_K,
	slaCreditPpm,
} from "./catalog/commercial-policy";
import { STARTING_CASH_CENTS } from "./catalog/economy-policy";
import { slaAvailabilityPpm } from "./catalog/sla-policy";
import { constantProject, oneBronzeInitial, twoBronzeInitial } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./game";
import type { Project } from "./project";

function allProjects(game: Game): Project[] {
	return game.customers.flatMap((customer) => [...customer.projects]);
}

function emptyFleetInitial(projects: GameInitial["customers"][number]["projects"]): GameInitial {
	return {
		customers: [{ id: "customer-1", projects }],
		assets: [],
	};
}

function tickHours(game: Game, hours: number): Game {
	for (let i = 0; i < hours; i++) {
		game.tick();
	}

	return game;
}

function expectedCredit(
	periodRevenueCents: number,
	periodPpm: number | null,
	targetPpm: number,
): number {
	const creditPpm = slaCreditPpm(periodPpm, targetPpm);

	if (creditPpm === 0) {
		return 0;
	}

	return Math.min(periodRevenueCents, Math.floor((periodRevenueCents * creditPpm) / 1_000_000));
}

describe("Game - billing close", () => {
	it("does not close before hourIndex reaches 168 and closes after 168 ticks", () => {
		const game = new Game(
			emptyFleetInitial([
				{
					...constantProject("project-1", 0, "served"),
					commercial: OPENING_COMMERCIAL_STUB,
				},
			]),
		);
		const project = allProjects(game)[0];

		tickHours(game, BILLING_PERIOD_HOURS - 1);

		expect(game.hourIndex).toBe(BILLING_PERIOD_HOURS - 1);
		expect(project?.settlements).toEqual([]);
		expect(project?.hoursServedInPeriod).toBe(BILLING_PERIOD_HOURS - 1);

		game.tick();

		expect(game.hourIndex).toBe(BILLING_PERIOD_HOURS);
		expect(project?.settlements).toEqual([
			{
				periodIndex: 1,
				hoursServedInPeriod: BILLING_PERIOD_HOURS,
				paygCents: 0,
				recurringCents: OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod,
				creditCents: 0,
				periodPpm: null,
				periodRevenueCents: OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod,
			},
		]);
		expect(project?.hoursServedInPeriod).toBe(0);
		expect(game.cashCents).toBe(
			STARTING_CASH_CENTS + OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod,
		);
	});

	it("prorates recurring when hoursServedInPeriod is less than 168", () => {
		const hoursOffered = 48;
		const hoursServed = BILLING_PERIOD_HOURS - hoursOffered;
		const recurringCents = Math.floor(
			(OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod * hoursServed) / BILLING_PERIOD_HOURS,
		);
		const game = new Game(
			emptyFleetInitial([
				{
					...constantProject("project-1", 0, "offered"),
					commercial: OPENING_COMMERCIAL_STUB,
				},
			]),
		);

		tickHours(game, hoursOffered);
		game.dispatch({ type: "acceptProject", payload: { projectId: "project-1" } });
		tickHours(game, hoursServed);

		const project = allProjects(game)[0];

		expect(game.hourIndex).toBe(BILLING_PERIOD_HOURS);
		expect(project?.settlements).toEqual([
			{
				periodIndex: 1,
				hoursServedInPeriod: hoursServed,
				paygCents: 0,
				recurringCents,
				creditCents: 0,
				periodPpm: null,
				periodRevenueCents: recurringCents,
			},
		]);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS + recurringCents);
	});

	it("counts emit-0 served hours toward recurring and not PAYG", () => {
		const game = tickHours(
			new Game(
				emptyFleetInitial([
					{
						...constantProject("project-1", 0, "served"),
						commercial: OPENING_COMMERCIAL_STUB,
					},
				]),
			),
			BILLING_PERIOD_HOURS,
		);
		const project = allProjects(game)[0];
		const settlement = project?.settlements[0];

		expect(settlement?.hoursServedInPeriod).toBe(BILLING_PERIOD_HOURS);
		expect(settlement?.paygCents).toBe(0);
		expect(settlement?.recurringCents).toBe(OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod);
		expect(settlement?.periodPpm).toBe(null);
		expect(settlement?.creditCents).toBe(0);
	});

	it("credits T1 when periodPpm is below targetPpm", () => {
		const game = tickHours(
			new Game(
				emptyFleetInitial([
					{
						...constantProject("project-1", 100, "served"),
						commercial: OPENING_COMMERCIAL_STUB,
					},
				]),
			),
			BILLING_PERIOD_HOURS,
		);
		const project = allProjects(game)[0];
		const settlement = project?.settlements[0];
		const periodPpm = slaAvailabilityPpm(0, 100 * BILLING_PERIOD_HOURS);
		const recurringCents = OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod;
		const creditCents = expectedCredit(
			recurringCents,
			periodPpm,
			OPENING_COMMERCIAL_STUB.targetPpm,
		);

		expect(settlement?.periodPpm).toBe(0);
		expect(settlement?.paygCents).toBe(0);
		expect(settlement?.recurringCents).toBe(recurringCents);
		expect(settlement?.creditCents).toBe(creditCents);
		expect(creditCents).toBeGreaterThan(0);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS + recurringCents - creditCents);
	});

	it("credits 0 when periodPpm meets targetPpm", () => {
		const game = tickHours(new Game(twoBronzeInitial), BILLING_PERIOD_HOURS);
		const settlements = allProjects(game).flatMap((project) => [...project.settlements]);

		expect(settlements).toHaveLength(2);

		for (const settlement of settlements) {
			expect(settlement.periodPpm).toBe(1_000_000);
			expect(settlement.creditCents).toBe(0);
		}
	});

	it("credits 0 when periodEmitted is 0", () => {
		const game = tickHours(
			new Game(
				emptyFleetInitial([
					{
						...constantProject("project-1", 0, "served"),
						commercial: {
							...OPENING_COMMERCIAL_STUB,
							targetPpm: 0,
							creditPpm: 1_000_000,
						},
					},
				]),
			),
			BILLING_PERIOD_HOURS,
		);
		const settlement = allProjects(game)[0]?.settlements[0];

		expect(settlement?.periodPpm).toBe(null);
		expect(settlement?.creditCents).toBe(0);
		expect(settlement?.recurringCents).toBe(OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod);
	});

	it("keeps the last 8 settlements", () => {
		const game = new Game(
			emptyFleetInitial([
				{
					...constantProject("project-1", 0, "served"),
					commercial: OPENING_COMMERCIAL_STUB,
				},
			]),
		);
		const periods = SETTLEMENT_HISTORY_K + 1;

		tickHours(game, periods * BILLING_PERIOD_HOURS);

		const project = allProjects(game)[0];
		const periodIndexes = project?.settlements.map((settlement) => settlement.periodIndex);

		expect(project?.settlements).toHaveLength(SETTLEMENT_HISTORY_K);
		expect(periodIndexes).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
		expect(game.hourIndex).toBe(periods * BILLING_PERIOD_HOURS);
	});

	it("does not write a close row for offered or declined projects", () => {
		for (const status of ["offered", "declined"] as const) {
			const game = tickHours(
				new Game(emptyFleetInitial([constantProject("project-1", 100, status)])),
				BILLING_PERIOD_HOURS,
			);
			const project = allProjects(game)[0];

			expect(project?.status).toBe(status);
			expect(project?.settlements).toEqual([]);
			expect(project?.hoursServedInPeriod).toBe(0);
			expect(game.hourIndex).toBe(BILLING_PERIOD_HOURS);
		}
	});

	it("still closes while jailed", () => {
		const game = tickHours(
			new Game({
				...emptyFleetInitial([
					{
						...constantProject("project-1", 0, "served"),
						commercial: OPENING_COMMERCIAL_STUB,
					},
				]),
				jailed: true,
				cashCents: 0,
			}),
			BILLING_PERIOD_HOURS,
		);
		const project = allProjects(game)[0];

		expect(game.jailed).toBe(true);
		expect(project?.settlements).toHaveLength(1);
		expect(project?.settlements[0]?.periodIndex).toBe(1);
		expect(game.cashCents).toBe(OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod);
	});

	it("leaves Bronze 1400 physics unchanged after 168 ticks", () => {
		const overloaded = tickHours(new Game(oneBronzeInitial), BILLING_PERIOD_HOURS);
		const healthy = tickHours(new Game(twoBronzeInitial), BILLING_PERIOD_HOURS);

		expect(overloaded.metrics.handledRequests + overloaded.metrics.droppedRequests).toBe(1400);
		expect(healthy.metrics.handledRequests).toBe(1400);
		expect(healthy.metrics.droppedRequests).toBe(0);
	});

	it("does not accrue PAYG-only recurring at close", () => {
		const game = tickHours(
			new Game(emptyFleetInitial([constantProject("project-1", 0, "served")])),
			BILLING_PERIOD_HOURS,
		);
		const settlement = allProjects(game)[0]?.settlements[0];

		expect(settlement?.recurringCents).toBe(PAYG_ONLY_COMMERCIAL_STUB.recurringCentsPerPeriod);
		expect(settlement?.paygCents).toBe(0);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
	});
});

import { describe, expect, it } from "bun:test";

import { APPOINTMENT_COMMERCIAL } from "./catalog/acquaintance-offer";
import { BILLING_PERIOD_HOURS } from "./catalog/commercial-policy";
import { DEBT_LIMIT_CENTS, SKU_ECONOMY, STARTING_CASH_CENTS } from "./catalog/economy-policy";
import { OPENING_SHIFT_HOURS, openingShiftOutcome } from "./catalog/opening-shift-policy";
import { DEFAULT_REGION } from "./catalog/regions";
import { openingInitial } from "./fixtures";
import { Game } from "./game";
import { FixedRandomSource } from "./traffic/random-source";

const MAYA = "maya-appointments";
const LEE = "lee-appointments";

function projectOf(game: Game, projectId: string) {
	return game.customers
		.flatMap((customer) => customer.projects)
		.find((project) => project.id === projectId);
}

function maya(game: Game) {
	return projectOf(game, MAYA);
}

function tickHours(game: Game, hours: number): void {
	for (let hour = 0; hour < hours; hour += 1) {
		game.tick();
	}
}

function finishActiveTask(game: Game): void {
	const durationHours = Math.ceil(
		(game.operations.tasks.find((task) => task.status === "active")?.durationMilliHours ?? 0) /
			1_000,
	);

	tickHours(game, durationHours);
}

function completeMayaSetup(game: Game, tenure: "owned" | "leased"): string {
	game.dispatch({ type: "acceptProject", payload: { projectId: MAYA } });

	if (tenure === "owned") {
		game.dispatch({ type: "buyServer", payload: { serverType: "bronze", region: DEFAULT_REGION } });
	} else {
		game.dispatch({
			type: "leaseServer",
			payload: { serverType: "bronze", region: DEFAULT_REGION },
		});
	}

	const serverId = game.servers[0]?.id;

	if (serverId === undefined) {
		throw new Error("expected a Bronze after buy or lease");
	}

	finishFirstProjectSetup(game, MAYA, serverId);

	return serverId;
}

function finishFirstProjectSetup(game: Game, projectId: string, serverId: string): void {
	game.dispatch({ type: "placeSetup", payload: { projectId, serverId } });
	game.dispatch({
		type: "installService",
		payload: { projectId, serviceId: "application-runtime" },
	});
	finishActiveTask(game);
	game.dispatch({
		type: "installService",
		payload: { projectId, serviceId: "relational-database" },
	});
	finishActiveTask(game);
	game.dispatch({ type: "configureConnection", payload: { projectId } });
	finishActiveTask(game);
	game.dispatch({ type: "startProject", payload: { projectId, serverId } });
}

function tickUntilOffered(game: Game, projectId: string): void {
	for (let hour = 0; hour < 48; hour += 1) {
		if (projectOf(game, projectId)?.status === "offered") {
			return;
		}

		game.tick();
	}

	throw new Error(`offer did not spawn: ${projectId}`);
}

function openingShiftFromGame(game: Game) {
	return openingShiftOutcome({
		hourIndex: game.hourIndex,
		cashCents: game.cashCents,
		jailed: game.jailed,
		projects: game.customers.flatMap((customer) =>
			customer.projects.map((project) => ({
				status: project.status,
				windowAvailabilityPpm: project.metrics.windowAvailabilityPpm,
				targetPpm: project.commercial.targetPpm,
				settlements: project.settlements.map((settlement) => ({
					periodPpm: settlement.periodPpm,
				})),
			})),
		),
	});
}

describe("Game - first-project settlement playtest", () => {
	it("plays acquaintance accept, setup, start, and a healthy owned week without credits", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		const cashAfterAccept = STARTING_CASH_CENTS + APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod;

		completeMayaSetup(game, "owned");

		expect(maya(game)?.status).toBe("served");
		expect(maya(game)?.ready).toBe(true);
		expect(game.cashCents).toBeLessThan(cashAfterAccept - SKU_ECONOMY.bronze.purchaseCents);
		expect(game.hourIndex).toBe(5);

		tickHours(game, BILLING_PERIOD_HOURS);

		const settlement = maya(game)?.settlements[0];

		expect(game.hourIndex).toBe(5 + BILLING_PERIOD_HOURS);
		expect(maya(game)?.periodEmitted).toBe(0);
		expect(settlement).toBeDefined();
		expect(settlement?.creditCents).toBe(0);
		expect(settlement?.periodPpm).toBeGreaterThanOrEqual(APPOINTMENT_COMMERCIAL.targetPpm);
		expect(game.jailed).toBe(false);
		expect(game.cashCents).toBeGreaterThan(-DEBT_LIMIT_CENTS);
	});

	it("burns more cash on a leased Bronze than an owned Bronze over the first billing cycle", () => {
		const owned = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		const leased = new Game(openingInitial, { random: new FixedRandomSource(0.5) });

		completeMayaSetup(owned, "owned");
		completeMayaSetup(leased, "leased");
		tickHours(owned, BILLING_PERIOD_HOURS);
		tickHours(leased, BILLING_PERIOD_HOURS);

		expect(leased.cashCents).toBeLessThan(owned.cashCents);
		expect(leased.finance.leaseCents).toBeGreaterThan(0);
		expect(owned.finance.leaseCents).toBe(0);
	});

	it("credits an overloaded parked week while the contract still emits, then resumes without resetting billing origin", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		const serverId = completeMayaSetup(game, "owned");
		const origin = maya(game)?.billingOriginHour;

		tickHours(game, 24);
		game.dispatch({ type: "unassignProject", payload: { projectId: MAYA } });
		tickHours(game, 1);

		expect(maya(game)?.status).toBe("offline");
		expect(maya(game)?.metrics.emittedRequests).toBeGreaterThan(0);
		expect(maya(game)?.metrics.handledRequests).toBe(0);

		tickHours(game, 79);
		game.dispatch({ type: "assignProject", payload: { projectId: MAYA, serverId } });
		tickHours(game, BILLING_PERIOD_HOURS - 24 - 80);

		const settlement = maya(game)?.settlements[0];

		expect(maya(game)?.status).toBe("served");
		expect(maya(game)?.billingOriginHour).toBe(origin);
		expect(settlement?.creditCents).toBeGreaterThan(0);
		expect(settlement?.periodPpm ?? 0).toBeLessThan(APPOINTMENT_COMMERCIAL.targetPpm);
	});

	it("recovers from opex debt by selling the owned box without hitting jail", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		const serverId = completeMayaSetup(game, "owned");

		tickHours(game, BILLING_PERIOD_HOURS);

		expect(game.cashCents).toBeLessThan(0);
		expect(game.jailed).toBe(false);

		game.dispatch({ type: "unassignProject", payload: { projectId: MAYA } });
		game.dispatch({ type: "sellServer", payload: { serverId } });

		expect(game.cashCents).toBeGreaterThan(0);
		expect(game.jailed).toBe(false);
		expect(game.servers).toHaveLength(0);
	});

	it("wins Opening Shift after a healthy owned week with two acquaintance contracts on one Bronze", () => {
		const game = new Game(openingInitial, { random: new FixedRandomSource(0.5) });
		const serverId = completeMayaSetup(game, "owned");

		tickUntilOffered(game, LEE);
		game.dispatch({ type: "acceptProject", payload: { projectId: LEE } });
		finishFirstProjectSetup(game, LEE, serverId);
		tickHours(game, OPENING_SHIFT_HOURS - game.hourIndex);

		expect(game.hourIndex).toBe(OPENING_SHIFT_HOURS);
		expect(maya(game)?.status).toBe("served");
		expect(projectOf(game, LEE)?.status).toBe("served");
		expect(game.jailed).toBe(false);
		expect(game.cashCents).toBeGreaterThan(0);
		expect(openingShiftFromGame(game).status).toBe("won");
	});
});

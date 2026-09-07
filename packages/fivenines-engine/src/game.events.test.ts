import { describe, expect, it } from "bun:test";

import {
	BILLING_PERIOD_HOURS,
	OPENING_COMMERCIAL_STUB,
	PAYG_SETTLE_HOURS,
} from "./catalog/commercial-policy";
import { constantProject, oneBronzeInitial, twoBronzeInitial } from "./fixtures";
import type { EngineEvent, GameInitial } from "./game";
import { Game } from "./game";

function emptyFleetServed(projects: GameInitial["customers"][number]["projects"]): GameInitial {
	return {
		customers: [{ id: "customer-1", projects }],
		assets: [],
	};
}

function offeredIdleBronze(): GameInitial {
	return {
		customers: [
			{
				id: "customer-1",
				projects: [constantProject("project-1", 700, "offered")],
			},
		],
		assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
		cashCents: 1,
	};
}

function eventTypes(events: readonly EngineEvent[]): readonly EngineEvent["type"][] {
	return events.map((event) => event.type);
}

describe("Game - events", () => {
	it("is empty on construct", () => {
		expect(new Game(twoBronzeInitial).events).toEqual([]);
	});

	it("emits slaBreached on the first empty-fleet tick of a served constant project", () => {
		const game = new Game(emptyFleetServed([constantProject("project-1", 700, "served")])).tick();

		expect(game.events).toContainEqual({
			type: "slaBreached",
			hourIndex: 0,
			projectId: "project-1",
			windowPpm: 0,
		});
	});

	it("does not emit serverSaturated on the first twoBronzeInitial tick", () => {
		const game = new Game(twoBronzeInitial).tick();

		expect(eventTypes(game.events)).not.toContain("serverSaturated");
	});

	it("emits serverSaturated on the first oneBronzeInitial tick", () => {
		const game = new Game(oneBronzeInitial).tick();

		expect(game.events).toContainEqual({
			type: "serverSaturated",
			hourIndex: 0,
			serverId: "server-1",
		});
	});

	it("emits cashLow when idle Bronze opex drives cash from positive to non-positive", () => {
		const game = new Game(offeredIdleBronze()).tick();

		expect(game.cashCents).toBeLessThanOrEqual(0);
		expect(game.events).toContainEqual({
			type: "cashLow",
			hourIndex: 0,
			cashCents: game.cashCents,
		});
	});

	it("emits paygSettled when receivable settles with a positive balance", () => {
		const game = new Game(twoBronzeInitial);

		while (game.hourIndex % PAYG_SETTLE_HOURS !== 0 || game.hourIndex === 0) {
			game.tick();
		}

		expect(eventTypes(game.events)).toContain("paygSettled");
		expect(game.events.find((event) => event.type === "paygSettled")?.cents).toBeGreaterThan(0);
	});

	it("emits weeklyCreditCharged after an empty-fleet served week with credits", () => {
		const game = new Game(
			emptyFleetServed([
				{
					...constantProject("project-1", 700, "served"),
					commercial: OPENING_COMMERCIAL_STUB,
				},
			]),
		);

		for (let hour = 0; hour < BILLING_PERIOD_HOURS; hour += 1) {
			game.tick();
		}

		const creditEvents = game.events.filter((event) => event.type === "weeklyCreditCharged");

		expect(creditEvents).toHaveLength(1);
		expect(creditEvents[0]).toMatchObject({
			type: "weeklyCreditCharged",
			projectId: "project-1",
		});
		expect(
			creditEvents[0]?.type === "weeklyCreditCharged" && creditEvents[0].creditCents,
		).toBeGreaterThan(0);
	});

	it("does not append sim events when decline or accept is dispatched", () => {
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [
						constantProject("project-1", 700, "offered"),
						constantProject("project-2", 700, "offered"),
					],
				},
			],
			assets: [],
		});

		game.tick();
		const afterTick = game.events;

		game.dispatch({ type: "declineProject", payload: { projectId: "project-1" } });
		game.dispatch({ type: "acceptProject", payload: { projectId: "project-2" } });

		expect(game.events).toBe(afterTick);
		expect(eventTypes(game.events)).not.toContain("weeklyCreditCharged");
	});
});

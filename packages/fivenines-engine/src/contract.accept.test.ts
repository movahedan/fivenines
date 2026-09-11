import { describe, expect, it } from "bun:test";

import { APPOINTMENT_COMMERCIAL } from "./catalog/acquaintance-offer";
import { STARTING_CASH_CENTS } from "./catalog/economy-policy";
import { openingInitial } from "./fixtures";
import { Game } from "./game";

function maya(game: Game) {
	return game.customers
		.flatMap((customer) => customer.projects)
		.find((project) => project.id === "maya-appointments");
}

describe("Game - acquaintance acceptance", () => {
	it("posts the advance once and does not route onto a server", () => {
		const game = new Game(openingInitial);

		game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });

		expect(maya(game)?.status).toBe("accepted");
		expect(maya(game)?.route).toBeUndefined();
		expect(maya(game)?.advancePostedCents).toBe(APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod);
		expect(game.cashCents).toBe(
			STARTING_CASH_CENTS + APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod,
		);
	});

	it("throws the second accept because the project is no longer offered", () => {
		const game = new Game(openingInitial);

		game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });

		expect(() =>
			game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } }),
		).toThrow("project is not offered: maya-appointments");
	});

	it("refunds the advance when the player cancels setup", () => {
		const game = new Game(openingInitial);

		game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });
		game.dispatch({ type: "cancelSetup", payload: { projectId: "maya-appointments" } });

		expect(maya(game)?.status).toBe("withdrawn");
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
	});

	it("withdraws at hour 39 when setup never completes", () => {
		const game = new Game(openingInitial);

		game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });

		for (let hour = 0; hour < 38; hour++) {
			game.tick();
			expect(maya(game)?.status).toBe("accepted");
		}

		game.tick();

		expect(game.hourIndex).toBe(39);
		expect(maya(game)?.status).toBe("withdrawn");
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
		expect(game.reputation).toBe(0);
	});

	it("does not start service until the project is ready", () => {
		const game = new Game(openingInitial);

		game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });
		game.dispatch({ type: "buyServer", payload: { serverType: "bronze", region: "utc+0" } });

		expect(() =>
			game.dispatch({
				type: "startProject",
				payload: { projectId: "maya-appointments", serverId: "server-1" },
			}),
		).toThrow("project is not ready: maya-appointments");
		expect(maya(game)?.status).toBe("accepted");
	});

	it("starts billing origin on startProject when ready", () => {
		const game = new Game({
			customers: [
				{
					id: "maya",
					trust: 70,
					hatred: 0,
					projects: [
						{
							id: "maya-appointments",
							estimatedRequestsPerHour: 120,
							status: "accepted",
							demand: "shaped",
							category: "saas",
							region: "utc+0",
							campaignProne: false,
							commercial: APPOINTMENT_COMMERCIAL,
							acceptedHour: 0,
							ready: true,
							advancePostedCents: APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod,
							prepaidAdvance: true,
						},
					],
				},
			],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			cashCents: STARTING_CASH_CENTS + APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod,
		});

		game.dispatch({
			type: "startProject",
			payload: { projectId: "maya-appointments", serverId: "server-1" },
		});

		expect(maya(game)?.status).toBe("served");
		expect(maya(game)?.billingOriginHour).toBe(0);
		expect(game.cashCents).toBe(
			STARTING_CASH_CENTS + APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod,
		);
	});

	it("expires an untouched offer at 48h and spawns the next acquaintance at the interval", () => {
		const game = new Game(openingInitial);

		for (let hour = 0; hour < 48; hour++) {
			game.tick();
		}

		expect(maya(game)?.status).toBe("expired");
		expect(game.customers.some((customer) => customer.id === "lee")).toBe(false);

		for (let hour = 0; hour < 24; hour++) {
			game.tick();
		}

		expect(game.customers.some((customer) => customer.id === "lee")).toBe(true);
		expect(
			game.customers
				.flatMap((customer) => customer.projects)
				.some((project) => project.id === "lee-appointments" && project.status === "offered"),
		).toBe(true);
	});
});

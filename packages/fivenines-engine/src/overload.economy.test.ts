import { describe, expect, it } from "bun:test";

import { SKU_ECONOMY, STARTING_CASH_CENTS, salvageCents } from "./catalog/economy-policy";
import { constantProject } from "./fixtures";
import type { GameInitial } from "./index";
import { Game } from "./index";

function offeredInitial(): GameInitial {
	return {
		customers: [
			{
				id: "customer-1",
				projects: [constantProject("project-1", 700, "offered")],
			},
		],
		assets: [],
	};
}

describe("Game - buy sell accept money", () => {
	it("debits Bronze purchase on buyServer", () => {
		const game = new Game(offeredInitial()).dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: "utc+0" },
		});

		expect(game.assets).toHaveLength(1);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS - SKU_ECONOMY.bronze.purchaseCents);
		expect(game.hourIndex).toBe(0);
		expect(game.finance.opexCents).toBe(0);
	});

	it("throws and does not debit when cash is below purchase", () => {
		const game = new Game({
			...offeredInitial(),
			cashCents: SKU_ECONOMY.bronze.purchaseCents - 1,
		});

		expect(() =>
			game.dispatch({
				type: "buyServer",
				payload: { serverType: "bronze", region: "utc+0" },
			}),
		).toThrow(`insufficient cash: ${SKU_ECONOMY.bronze.purchaseCents}`);
		expect(game.cashCents).toBe(SKU_ECONOMY.bronze.purchaseCents - 1);
		expect(game.assets).toHaveLength(0);
	});

	it("throws and does not debit when buyServer is dispatched while jailed", () => {
		const game = new Game({
			...offeredInitial(),
			jailed: true,
		});

		expect(() =>
			game.dispatch({
				type: "buyServer",
				payload: { serverType: "bronze", region: "utc+0" },
			}),
		).toThrow("cannot buyServer while jailed");
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
		expect(game.assets).toHaveLength(0);
	});

	it("credits 70 percent salvage on sellServer", () => {
		const game = new Game(offeredInitial()).dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: "utc+0" },
		});

		game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
		expect(game.cashCents).toBe(
			STARTING_CASH_CENTS -
				SKU_ECONOMY.bronze.purchaseCents +
				salvageCents(SKU_ECONOMY.bronze.purchaseCents),
		);
	});

	it("credits salvage on sellServer while jailed", () => {
		const game = new Game({
			customers: [],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			cashCents: -5_000,
			jailed: true,
		});

		game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
		expect(game.cashCents).toBe(-5_000 + salvageCents(SKU_ECONOMY.bronze.purchaseCents));
		expect(game.jailed).toBe(true);
	});

	it("throws and does not change cash when acceptProject is dispatched while jailed", () => {
		const game = new Game({
			...offeredInitial(),
			jailed: true,
		});

		expect(() =>
			game.dispatch({ type: "acceptProject", payload: { projectId: "project-1" } }),
		).toThrow("cannot acceptProject while jailed");
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
		expect(game.customers[0]?.projects[0]?.status).toBe("offered");
	});
});

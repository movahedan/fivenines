import { describe, expect, it } from "bun:test";

import { SKU_ECONOMY, STARTING_CASH_CENTS, skuHourlyOpex } from "./catalog/economy-policy";
import { constantProject } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./index";
import { Server } from "./server";

function emptyFleet(cashCents = STARTING_CASH_CENTS): GameInitial {
	return {
		customers: [],
		assets: [],
		cashCents,
	};
}

function leasedBronzeIdle(): GameInitial {
	return {
		customers: [],
		assets: [
			{
				kind: "server",
				id: "server-1",
				catalogId: "bronze",
				region: "utc+0",
				tenure: { kind: "leased", hourlyCents: SKU_ECONOMY.bronze.leaseHourlyCents },
			},
		],
	};
}

describe("Game - server tenure", () => {
	it("stamps owned tenure and debits catalog purchase on buyServer", () => {
		const game = new Game(emptyFleet()).dispatch({
			type: "buyServer",
			payload: { serverType: "bronze", region: "utc+0" },
		});

		expect(game.assets[0]?.tenure).toEqual({
			kind: "owned",
			purchaseCents: SKU_ECONOMY.bronze.purchaseCents,
		});
		expect(game.cashCents).toBe(STARTING_CASH_CENTS - SKU_ECONOMY.bronze.purchaseCents);
		expect(game.hourIndex).toBe(0);
	});

	it("credits salvage from tenure purchaseCents on sellServer", () => {
		const game = new Game({
			customers: [],
			assets: [
				{
					kind: "server",
					id: "server-1",
					catalogId: "bronze",
					region: "utc+0",
					tenure: { kind: "owned", purchaseCents: 10_000 },
				},
			],
			cashCents: 0,
		});

		game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
		expect(game.cashCents).toBe(7_000);
	});

	it("leaves cash unchanged and stamps leased tenure on leaseServer", () => {
		const game = new Game(emptyFleet()).dispatch({
			type: "leaseServer",
			payload: { serverType: "bronze", region: "utc+0" },
		});

		expect(game.assets).toHaveLength(1);
		expect(game.assets[0]?.id).toBe("server-1");
		expect(game.assets[0]?.tenure).toEqual({
			kind: "leased",
			hourlyCents: SKU_ECONOMY.bronze.leaseHourlyCents,
		});
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
		expect(game.hourIndex).toBe(0);
	});

	it("charges idle owned opex plus leaseHourlyCents on a leased idle Bronze tick", () => {
		const bronze = SKU_ECONOMY.bronze;
		const ownedIdle = skuHourlyOpex("bronze", 0).opexCents;
		const game = new Game(leasedBronzeIdle()).tick();

		expect(game.finance.maintenanceCents).toBe(bronze.maintenanceCentsPerHour);
		expect(game.finance.powerCents).toBe(bronze.idlePowerCentsPerHour);
		expect(game.finance.leaseCents).toBe(bronze.leaseHourlyCents);
		expect(game.finance.opexCents).toBe(ownedIdle + bronze.leaseHourlyCents);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS - ownedIdle - bronze.leaseHourlyCents);
	});

	it("gives a leased Bronze the same compute, net, and RAM as an owned Bronze", () => {
		const owned = new Server({ id: "owned", catalogId: "bronze", region: "utc+0" });
		const leased = new Server({
			id: "leased",
			catalogId: "bronze",
			region: "utc+0",
			tenure: { kind: "leased", hourlyCents: SKU_ECONOMY.bronze.leaseHourlyCents },
		});

		expect(leased.computeUnitsPerHour).toBe(owned.computeUnitsPerHour);
		expect(leased.networkBytesPerHour).toBe(owned.networkBytesPerHour);
		expect(leased.memoryMiB).toBe(owned.memoryMiB);
		expect(leased.baseMemoryMiB).toBe(owned.baseMemoryMiB);
	});

	it("throws when sellServer targets a leased box", () => {
		const game = new Game(leasedBronzeIdle());

		expect(() => game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } })).toThrow(
			"server is leased: server-1",
		);
		expect(game.assets).toHaveLength(1);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
	});

	it("throws when releaseServer targets an owned box", () => {
		const game = new Game({
			customers: [],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
		});

		expect(() =>
			game.dispatch({ type: "releaseServer", payload: { serverId: "server-1" } }),
		).toThrow("server is owned: server-1");
		expect(game.assets).toHaveLength(1);
	});

	it("throws when releaseServer runs while a served project routes to the box", () => {
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [constantProject("project-1", 700, "served", "server-1")],
				},
			],
			assets: [
				{
					kind: "server",
					id: "server-1",
					catalogId: "bronze",
					region: "utc+0",
					tenure: { kind: "leased", hourlyCents: SKU_ECONOMY.bronze.leaseHourlyCents },
				},
			],
		});

		expect(() =>
			game.dispatch({ type: "releaseServer", payload: { serverId: "server-1" } }),
		).toThrow("server has a served project routed to it: project-1");
		expect(game.assets).toHaveLength(1);
	});

	it("releases a leased box after park without raising cash", () => {
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [constantProject("project-1", 700, "served", "server-1")],
				},
			],
			assets: [
				{
					kind: "server",
					id: "server-1",
					catalogId: "bronze",
					region: "utc+0",
					tenure: { kind: "leased", hourlyCents: SKU_ECONOMY.bronze.leaseHourlyCents },
				},
			],
		});

		game.dispatch({ type: "unassignProject", payload: { projectId: "project-1" } });
		game.dispatch({ type: "releaseServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
	});

	it("throws when leaseServer runs while jailed", () => {
		const game = new Game({
			...emptyFleet(),
			jailed: true,
		});

		expect(() =>
			game.dispatch({
				type: "leaseServer",
				payload: { serverType: "bronze", region: "utc+0" },
			}),
		).toThrow("cannot leaseServer while jailed");
		expect(game.assets).toHaveLength(0);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
	});

	it("releases a leased box while jailed without salvage", () => {
		const game = new Game({
			...leasedBronzeIdle(),
			cashCents: -5_000,
			jailed: true,
		});

		game.dispatch({ type: "releaseServer", payload: { serverId: "server-1" } });

		expect(game.assets).toHaveLength(0);
		expect(game.cashCents).toBe(-5_000);
		expect(game.jailed).toBe(true);
	});

	it("rejects non-integer tenure cents before they can reach cash", () => {
		expect(
			() =>
				new Server({
					id: "server-1",
					catalogId: "bronze",
					region: "utc+0",
					tenure: { kind: "leased", hourlyCents: 1.5 },
				}),
		).toThrow("hourlyCents");
		expect(
			() =>
				new Server({
					id: "server-1",
					catalogId: "bronze",
					region: "utc+0",
					tenure: { kind: "owned", purchaseCents: -1 },
				}),
		).toThrow("purchaseCents");
	});

	it("adds lease rent on top of loaded power, not only idle opex", () => {
		const bronze = SKU_ECONOMY.bronze;
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [constantProject("project-1", 700, "served", "server-1")],
				},
			],
			assets: [
				{
					kind: "server",
					id: "server-1",
					catalogId: "bronze",
					region: "utc+0",
					tenure: { kind: "leased", hourlyCents: bronze.leaseHourlyCents },
				},
			],
		}).tick();

		expect(game.finance.leaseCents).toBe(bronze.leaseHourlyCents);
		expect(game.finance.powerCents).toBeGreaterThan(bronze.idlePowerCentsPerHour);
		expect(game.finance.opexCents).toBe(
			game.finance.maintenanceCents + game.finance.powerCents + bronze.leaseHourlyCents,
		);
	});

	it("throws unknown server id when releaseServer names a missing box", () => {
		const game = new Game(emptyFleet());

		expect(() =>
			game.dispatch({ type: "releaseServer", payload: { serverId: "server-9" } }),
		).toThrow("unknown server id: server-9");
	});
});

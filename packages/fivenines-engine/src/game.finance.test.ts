import { describe, expect, it } from "bun:test";

import { DEBT_LIMIT_CENTS, SKU_ECONOMY, STARTING_CASH_CENTS } from "./catalog/economy-policy";
import type { GameInitial } from "./game";
import { Game, oneBronzeInitial, openingInitial, twoBronzeInitial } from "./index";

const idleBronzeInitial: GameInitial = {
	customers: [],
	assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
};

describe("Game - construct wallet", () => {
	it("starts at 25000 cents and not jailed when GameInitial omits cash", () => {
		const game = new Game(oneBronzeInitial);

		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
		expect(game.jailed).toBe(false);
		expect(game.finance).toEqual({
			cashCents: STARTING_CASH_CENTS,
			jailed: false,
			opexCents: 0,
			maintenanceCents: 0,
			powerCents: 0,
		});
	});

	it("uses cashCents and jailed overrides from GameInitial", () => {
		const game = new Game({
			...openingInitial,
			cashCents: 123,
			jailed: true,
		});

		expect(game.cashCents).toBe(123);
		expect(game.jailed).toBe(true);
	});
});

describe("Game - opex", () => {
	it("charges maintenance plus idle power when a Bronze box is owned and assignedRequests is 0", () => {
		const bronze = SKU_ECONOMY.bronze;
		const game = new Game(idleBronzeInitial).tick();

		expect(game.finance.maintenanceCents).toBe(bronze.maintenanceCentsPerHour);
		expect(game.finance.powerCents).toBe(bronze.idlePowerCentsPerHour);
		expect(game.finance.opexCents).toBe(
			bronze.maintenanceCentsPerHour + bronze.idlePowerCentsPerHour,
		);
		expect(game.cashCents).toBe(
			STARTING_CASH_CENTS - bronze.maintenanceCentsPerHour - bronze.idlePowerCentsPerHour,
		);
	});

	it("bills busy Bronze power between idle and max on a healthy two-Bronze hour", () => {
		const bronze = SKU_ECONOMY.bronze;
		const game = new Game(twoBronzeInitial).tick();

		expect(game.finance.powerCents).toBeGreaterThan(bronze.idlePowerCentsPerHour * 2);
		expect(game.finance.powerCents).toBeLessThanOrEqual(bronze.maxPowerCentsPerHour * 2);
		expect(game.finance.maintenanceCents).toBe(bronze.maintenanceCentsPerHour * 2);
	});

	it("bills max power when utilization exceeds 100", () => {
		const thinRam = SKU_ECONOMY["thin-ram"];
		const game = new Game({
			customers: oneBronzeInitial.customers,
			assets: [{ kind: "server", id: "server-1", catalogId: "thin-ram", region: "utc+0" }],
		}).tick();

		expect(game.servers[0]?.metrics.utilization).toBeGreaterThan(100);
		expect(game.finance.powerCents).toBe(thinRam.maxPowerCentsPerHour);
		expect(game.finance.maintenanceCents).toBe(thinRam.maintenanceCentsPerHour);
	});

	it("charges 0 opex when the fleet is empty", () => {
		const game = new Game(openingInitial).tick();

		expect(game.assets).toHaveLength(0);
		expect(game.finance.opexCents).toBe(0);
		expect(game.finance.maintenanceCents).toBe(0);
		expect(game.finance.powerCents).toBe(0);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
	});

	it("leaves 1400 handled plus dropped unchanged after one Bronze opex tick", () => {
		const game = new Game(oneBronzeInitial);

		expect(game.cashCents).toBe(STARTING_CASH_CENTS);

		game.tick();

		expect(game.metrics.handledRequests + game.metrics.droppedRequests).toBe(1400);
		expect(game.cashCents).toBe(
			STARTING_CASH_CENTS - game.finance.opexCents + game.metrics.handledRequests,
		);
		expect(game.finance.opexCents).toBeGreaterThan(0);
	});
});

describe("Game - jail", () => {
	it("stays jailed after a sell that raises cash above the debt limit", () => {
		const bronze = SKU_ECONOMY.bronze;
		const idleOpex = bronze.maintenanceCentsPerHour + bronze.idlePowerCentsPerHour;
		const game = new Game({
			...idleBronzeInitial,
			cashCents: -DEBT_LIMIT_CENTS + idleOpex,
		}).tick();

		expect(game.jailed).toBe(true);
		expect(game.cashCents).toBe(-DEBT_LIMIT_CENTS);

		const cashBeforeSell = game.cashCents;

		game.dispatch({ type: "sellServer", payload: { serverId: "server-1" } });

		expect(game.cashCents).toBeGreaterThan(cashBeforeSell);
		expect(game.jailed).toBe(true);
	});
});

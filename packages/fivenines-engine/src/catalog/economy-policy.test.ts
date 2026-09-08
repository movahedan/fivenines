import { describe, expect, it } from "bun:test";

import {
	powerCentsPerHour,
	SALVAGE_PERCENT,
	SKU_ECONOMY,
	STARTING_CASH_CENTS,
	salvageCents,
	skuHourlyOpex,
} from "./economy-policy";
import { SERVER_CATALOG_IDS, type ServerCatalogId } from "./kernel";

describe("economy-policy - v1 tables", () => {
	it("starts the wallet at 25000 cents and salvages 70 percent of purchase", () => {
		expect(STARTING_CASH_CENTS).toBe(25_000);
		expect(SALVAGE_PERCENT).toBe(70);
		expect(salvageCents(18_000)).toBe(12_600);
		expect(salvageCents(14_000)).toBe(9_800);
	});

	it("prices every kernel SKU in integer cents", () => {
		const expected: Record<
			ServerCatalogId,
			{
				purchaseCents: number;
				leaseHourlyCents: number;
				maintenanceCentsPerHour: number;
				idlePowerCentsPerHour: number;
				maxPowerCentsPerHour: number;
			}
		> = {
			bronze: {
				purchaseCents: 18_000,
				leaseHourlyCents: 147,
				maintenanceCentsPerHour: 80,
				idlePowerCentsPerHour: 35,
				maxPowerCentsPerHour: 120,
			},
			silver: {
				purchaseCents: 28_000,
				leaseHourlyCents: 260,
				maintenanceCentsPerHour: 150,
				idlePowerCentsPerHour: 60,
				maxPowerCentsPerHour: 220,
			},
			gold: {
				purchaseCents: 48_000,
				leaseHourlyCents: 466,
				maintenanceCentsPerHour: 280,
				idlePowerCentsPerHour: 100,
				maxPowerCentsPerHour: 380,
			},
			platinum: {
				purchaseCents: 72_000,
				leaseHourlyCents: 809,
				maintenanceCentsPerHour: 520,
				idlePowerCentsPerHour: 160,
				maxPowerCentsPerHour: 600,
			},
			diamond: {
				purchaseCents: 120_000,
				leaseHourlyCents: 1455,
				maintenanceCentsPerHour: 960,
				idlePowerCentsPerHour: 280,
				maxPowerCentsPerHour: 1_000,
			},
			"thin-ram": {
				purchaseCents: 14_000,
				leaseHourlyCents: 270,
				maintenanceCentsPerHour: 200,
				idlePowerCentsPerHour: 45,
				maxPowerCentsPerHour: 150,
			},
		};

		expect(Object.keys(SKU_ECONOMY)).toEqual(SERVER_CATALOG_IDS);

		for (const catalogId of SERVER_CATALOG_IDS) {
			expect(SKU_ECONOMY[catalogId]).toEqual(expected[catalogId]);
			expect(salvageCents(SKU_ECONOMY[catalogId].purchaseCents)).toBe(
				Math.floor((expected[catalogId].purchaseCents * 70) / 100),
			);
		}
	});

	it("charges more absolute maintenance on better SKUs; unit cost still falls; thin-ram is a high-maint trap", () => {
		expect(SKU_ECONOMY.bronze.maintenanceCentsPerHour).toBeLessThan(
			SKU_ECONOMY.silver.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY.silver.maintenanceCentsPerHour).toBeLessThan(
			SKU_ECONOMY.gold.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY.gold.maintenanceCentsPerHour).toBeLessThan(
			SKU_ECONOMY.platinum.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY.platinum.maintenanceCentsPerHour).toBeLessThan(
			SKU_ECONOMY.diamond.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY["thin-ram"].maintenanceCentsPerHour).toBeGreaterThan(
			SKU_ECONOMY.bronze.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY.bronze.maintenanceCentsPerHour / 1_000).toBeGreaterThan(
			SKU_ECONOMY.silver.maintenanceCentsPerHour / 2_000,
		);
		expect(SKU_ECONOMY.silver.maintenanceCentsPerHour / 2_000).toBeGreaterThan(
			SKU_ECONOMY.gold.maintenanceCentsPerHour / 4_000,
		);
	});

	it("bills idle power at 0 utilization and max power when utilization exceeds 100", () => {
		expect(powerCentsPerHour("bronze", 0)).toBe(35);
		expect(powerCentsPerHour("bronze", 50)).toBe(35 + Math.floor((85 * 50) / 100));
		expect(powerCentsPerHour("bronze", 100)).toBe(120);
		expect(powerCentsPerHour("bronze", 140)).toBe(120);
	});

	it("keeps skuHourlyOpex as maintenance plus power without lease rent", () => {
		const bronze = SKU_ECONOMY.bronze;

		expect(skuHourlyOpex("bronze", 0)).toEqual({
			maintenanceCents: bronze.maintenanceCentsPerHour,
			powerCents: bronze.idlePowerCentsPerHour,
			opexCents: bronze.maintenanceCentsPerHour + bronze.idlePowerCentsPerHour,
		});
	});
});

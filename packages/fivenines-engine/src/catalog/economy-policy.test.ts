import { describe, expect, it } from "bun:test";

import {
	powerCentsPerHour,
	SALVAGE_PERCENT,
	SKU_ECONOMY,
	STARTING_CASH_CENTS,
	salvageCents,
} from "./economy-policy";
import { SERVER_CATALOG_IDS, type ServerCatalogId } from "./kernel";

describe("economy-policy - v1 tables", () => {
	it("starts the wallet at 40000 cents and salvages 70 percent of purchase", () => {
		expect(STARTING_CASH_CENTS).toBe(40_000);
		expect(SALVAGE_PERCENT).toBe(70);
		expect(salvageCents(16_000)).toBe(11_200);
		expect(salvageCents(14_000)).toBe(9_800);
	});

	it("prices every kernel SKU in integer cents", () => {
		const expected: Record<
			ServerCatalogId,
			{
				purchaseCents: number;
				maintenanceCentsPerHour: number;
				idlePowerCentsPerHour: number;
				maxPowerCentsPerHour: number;
			}
		> = {
			bronze: {
				purchaseCents: 16_000,
				maintenanceCentsPerHour: 80,
				idlePowerCentsPerHour: 35,
				maxPowerCentsPerHour: 120,
			},
			silver: {
				purchaseCents: 28_000,
				maintenanceCentsPerHour: 55,
				idlePowerCentsPerHour: 60,
				maxPowerCentsPerHour: 220,
			},
			gold: {
				purchaseCents: 48_000,
				maintenanceCentsPerHour: 40,
				idlePowerCentsPerHour: 100,
				maxPowerCentsPerHour: 380,
			},
			platinum: {
				purchaseCents: 72_000,
				maintenanceCentsPerHour: 28,
				idlePowerCentsPerHour: 160,
				maxPowerCentsPerHour: 600,
			},
			diamond: {
				purchaseCents: 120_000,
				maintenanceCentsPerHour: 18,
				idlePowerCentsPerHour: 280,
				maxPowerCentsPerHour: 1_000,
			},
			"thin-ram": {
				purchaseCents: 14_000,
				maintenanceCentsPerHour: 90,
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

	it("charges less hourly maintenance on better SKUs; thin-ram is a high-maint trap", () => {
		expect(SKU_ECONOMY.bronze.maintenanceCentsPerHour).toBeGreaterThan(
			SKU_ECONOMY.silver.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY.silver.maintenanceCentsPerHour).toBeGreaterThan(
			SKU_ECONOMY.gold.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY.gold.maintenanceCentsPerHour).toBeGreaterThan(
			SKU_ECONOMY.platinum.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY.platinum.maintenanceCentsPerHour).toBeGreaterThan(
			SKU_ECONOMY.diamond.maintenanceCentsPerHour,
		);
		expect(SKU_ECONOMY["thin-ram"].maintenanceCentsPerHour).toBeGreaterThan(
			SKU_ECONOMY.bronze.maintenanceCentsPerHour,
		);
	});

	it("bills idle power at 0 utilization and max power when utilization exceeds 100", () => {
		expect(powerCentsPerHour("bronze", 0)).toBe(35);
		expect(powerCentsPerHour("bronze", 50)).toBe(35 + Math.floor((85 * 50) / 100));
		expect(powerCentsPerHour("bronze", 100)).toBe(120);
		expect(powerCentsPerHour("bronze", 140)).toBe(120);
	});
});

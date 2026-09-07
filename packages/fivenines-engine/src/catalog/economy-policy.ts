import type { ServerCatalogId } from "./kernel";

export const STARTING_CASH_CENTS = 40_000;
export const DEBT_LIMIT_CENTS = 20_000;
export const SALVAGE_PERCENT = 70;

export interface SkuEconomy {
	purchaseCents: number;
	maintenanceCentsPerHour: number;
	idlePowerCentsPerHour: number;
	maxPowerCentsPerHour: number;
}

export const SKU_ECONOMY: Record<ServerCatalogId, SkuEconomy> = {
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

export function salvageCents(purchaseCents: number): number {
	return Math.floor((purchaseCents * SALVAGE_PERCENT) / 100);
}

export function powerCentsPerHour(catalogId: ServerCatalogId, utilization: number): number {
	const sku = SKU_ECONOMY[catalogId];
	const utilForPower = Math.min(utilization, 100);

	return (
		sku.idlePowerCentsPerHour +
		Math.floor(((sku.maxPowerCentsPerHour - sku.idlePowerCentsPerHour) * utilForPower) / 100)
	);
}

export function skuHourlyOpex(
	catalogId: ServerCatalogId,
	utilization: number,
): {
	maintenanceCents: number;
	powerCents: number;
	opexCents: number;
} {
	const maintenanceCents = SKU_ECONOMY[catalogId].maintenanceCentsPerHour;
	const powerCents = powerCentsPerHour(catalogId, utilization);

	return {
		maintenanceCents,
		powerCents,
		opexCents: maintenanceCents + powerCents,
	};
}

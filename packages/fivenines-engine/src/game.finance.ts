import { skuHourlyOpex } from "./catalog/economy-policy";
import type { ServerCatalogId } from "./catalog/kernel";
import type { ServerTenure } from "./server";

export interface GameOpexTotals {
	opexCents: number;
	maintenanceCents: number;
	powerCents: number;
	leaseCents: number;
}

export interface GameFinanceSnapshot extends GameOpexTotals {
	cashCents: number;
	accountsReceivableCents: number;
	jailed: boolean;
}

export const EMPTY_GAME_OPEX: GameOpexTotals = {
	opexCents: 0,
	maintenanceCents: 0,
	powerCents: 0,
	leaseCents: 0,
};

export function measureGameOpex(
	servers: readonly {
		catalogId: ServerCatalogId;
		metrics: { utilization: number };
		tenure: ServerTenure;
	}[],
): GameOpexTotals {
	if (servers.length === 0) {
		return EMPTY_GAME_OPEX;
	}

	let maintenanceCents = 0;
	let powerCents = 0;
	let leaseCents = 0;

	for (const server of servers) {
		const hourly = skuHourlyOpex(server.catalogId, server.metrics.utilization);

		maintenanceCents += hourly.maintenanceCents;
		powerCents += hourly.powerCents;
		leaseCents += server.tenure.kind === "leased" ? server.tenure.hourlyCents : 0;
	}

	return {
		maintenanceCents,
		powerCents,
		leaseCents,
		opexCents: maintenanceCents + powerCents + leaseCents,
	};
}

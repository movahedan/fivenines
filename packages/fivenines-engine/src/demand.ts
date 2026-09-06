import { units } from "@packages/shared/units";

import type { Server } from "./server";

export function assignDemandByCpuCap(servers: readonly Server[], demandRequests: number): void {
	const demand = units.asNonNegativeInteger(demandRequests, "demandRequests");
	const shares = splitByCpuCap(demand, servers);

	for (const [index, server] of servers.entries()) {
		server.assignDemand(shares[index] ?? 0);
	}
}

function splitByCpuCap(demand: number, servers: readonly Server[]): number[] {
	if (servers.length === 0) {
		return [];
	}

	const totalCap = servers.reduce((sum, server) => sum + server.cpuMillicores, 0);

	if (totalCap === 0) {
		return servers.map(() => 0);
	}

	const shares = servers.map((server) => Math.floor((demand * server.cpuMillicores) / totalCap));
	let assigned = shares.reduce((sum, share) => sum + share, 0);

	for (let index = 0; assigned < demand && index < shares.length; index += 1) {
		const current = shares[index];

		if (current === undefined) {
			continue;
		}

		shares[index] = current + 1;
		assigned += 1;
	}

	return shares;
}

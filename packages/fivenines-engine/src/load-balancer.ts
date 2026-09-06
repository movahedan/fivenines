import { units } from "@packages/utils/units";

import type { Server } from "./server";

export interface LoadBalancerInitial {
	id: string;
}

export class LoadBalancer {
	readonly id: string;
	readonly kind = "loadBalancer" as const;

	constructor(initial: LoadBalancerInitial) {
		this.id = initial.id;
	}

	tick(servers: readonly Server[], demandRequests: number): void {
		assignDemandByCpuCap(servers, demandRequests);
	}
}

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

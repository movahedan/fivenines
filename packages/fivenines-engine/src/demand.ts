import { units } from "@packages/shared/units";

import type { RegionId } from "./catalog/regions";
import type { ProjectCategory } from "./project";
import type { Server } from "./server";

export function placeProjectDemand(
	servers: readonly Server[],
	demandRequests: number,
	region: RegionId,
	category: ProjectCategory,
): number {
	const demand = units.asNonNegativeInteger(demandRequests, "demandRequests");

	if (demand === 0 || servers.length === 0) {
		return demand;
	}

	const local = servers.filter((server) => server.region === region);
	const remote = servers.filter((server) => server.region !== region);
	const localAssigned = assignToPool(local, demand, category, region);
	const remainder = demand - localAssigned;
	const remoteAssigned = assignToPool(remote, remainder, category, region);

	return remainder - remoteAssigned;
}

function assignToPool(
	pool: readonly Server[],
	demand: number,
	category: ProjectCategory,
	sourceRegion: RegionId,
): number {
	if (demand === 0) {
		return 0;
	}

	const eligible = pool.filter((server) => server.remainingHeadroom > 0);

	if (eligible.length === 0) {
		return 0;
	}

	const totalHeadroom = eligible.reduce((sum, server) => sum + server.remainingHeadroom, 0);
	const toPlace = Math.min(demand, totalHeadroom);
	const shares = splitByCpuCap(toPlace, eligible);
	let placed = 0;

	for (const [index, server] of eligible.entries()) {
		const take = Math.min(shares[index] ?? 0, server.remainingHeadroom);

		if (take === 0) {
			continue;
		}

		server.assignSlice({ category, requests: take, sourceRegion });
		placed += take;
	}

	let leftover = toPlace - placed;

	for (const server of eligible) {
		if (leftover === 0) {
			break;
		}

		const take = Math.min(leftover, server.remainingHeadroom);

		if (take === 0) {
			continue;
		}

		server.assignSlice({ category, requests: take, sourceRegion });
		leftover -= take;
		placed += take;
	}

	return placed;
}

function splitByCpuCap(demand: number, servers: readonly Server[]): number[] {
	if (servers.length === 0) {
		return [];
	}

	const totalCap = servers.reduce((sum, server) => sum + server.computeUnitsPerHour, 0);

	if (totalCap === 0) {
		return servers.map(() => 0);
	}

	const shares = servers.map((server) =>
		Math.floor((demand * server.computeUnitsPerHour) / totalCap),
	);
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

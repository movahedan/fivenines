import { units } from "@packages/shared/units";

import type { RegionId } from "./catalog/regions";
import type { ProjectCategory } from "./project";
import type { Server } from "./server";

/**
 * Places a project's hour of demand on the one box it is routed to and returns
 * what did not fit. There is no fleet pool: an overloaded project drops its
 * leftover rather than borrowing headroom from another box.
 */
export function placeProjectDemand(
	server: Server,
	demandRequests: number,
	region: RegionId,
	category: ProjectCategory,
	projectId: string,
): number {
	const demand = units.asNonNegativeInteger(demandRequests, "demandRequests");
	const assigned = Math.min(demand, server.remainingHeadroom);

	if (assigned === 0) {
		return demand;
	}

	server.assignSlice({ category, requests: assigned, sourceRegion: region, projectId });

	return demand - assigned;
}

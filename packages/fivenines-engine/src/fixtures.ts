import {
	ACQUAINTANCE_OFFERS,
	APPOINTMENT_COMMERCIAL,
	APPOINTMENT_SITE_BASELINE,
} from "./catalog/acquaintance-offer";
import { PAYG_ONLY_COMMERCIAL_STUB } from "./catalog/commercial-policy";
import { OFFER_TTL_HOURS } from "./catalog/contract-policy";
import type { GameInitial } from "./game";
import type { ProjectInitial, ProjectStatus } from "./project";

export function constantProject(
	id: string,
	estimatedRequestsPerHour: number,
	status: ProjectStatus,
	serverId?: string,
): ProjectInitial {
	return {
		id,
		estimatedRequestsPerHour,
		status,
		demand: "constant",
		category: "saas",
		region: "utc+0",
		campaignProne: false,
		commercial: PAYG_ONLY_COMMERCIAL_STUB,
		...(serverId === undefined ? {} : { route: { kind: "server", serverId } }),
	};
}

/** Both 700 RPS projects share one Bronze: 1400 against a 1000 cap, CPU-bound. */
export const oneBronzeInitial: GameInitial = {
	customers: [
		{
			id: "customer-1",
			projects: [
				constantProject("project-1", 700, "served", "server-1"),
				constantProject("project-2", 700, "served", "server-1"),
			],
		},
	],
	assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
};

/**
 * Isolation fixture: one project per Bronze. Saturating one box must never let
 * the other project's demand spill onto it, and vice versa.
 */
export const twoBronzeInitial: GameInitial = {
	customers: [
		{
			id: "customer-1",
			projects: [
				constantProject("project-1", 700, "served", "server-1"),
				constantProject("project-2", 700, "served", "server-2"),
			],
		},
	],
	assets: [
		{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" },
		{ kind: "server", id: "server-2", catalogId: "bronze", region: "utc+0" },
	],
};

const maya = ACQUAINTANCE_OFFERS[0];

/** First acquaintance appointment only. Opening Shift clock and cash are unchanged. */
export const openingInitial: GameInitial = {
	customers:
		maya === undefined
			? []
			: [
					{
						id: maya.customerId,
						trust: maya.trust,
						hatred: maya.hatred,
						projects: [
							{
								id: maya.projectId,
								estimatedRequestsPerHour: APPOINTMENT_SITE_BASELINE,
								status: "offered",
								demand: "shaped",
								category: "saas",
								region: maya.region,
								campaignProne: false,
								commercial: APPOINTMENT_COMMERCIAL,
								offerTtlHours: OFFER_TTL_HOURS,
								setupAllowanceHours: maya.setupAllowanceHours,
							},
						],
					},
				],
	assets: [],
};

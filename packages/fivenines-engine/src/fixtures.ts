import { commercialTermsForCategory, PAYG_ONLY_COMMERCIAL_STUB } from "./catalog/commercial-policy";
import type { RegionId } from "./catalog/regions";
import type { GameInitial } from "./game";
import type { CampaignWindow, ProjectCategory, ProjectInitial, ProjectStatus } from "./project";

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

const OPENING_TARGET_PPM: Partial<Record<string, number>> = {
	"acme-web": 995_000,
	"initech-tps": 980_000,
};

function shapedProject(
	id: string,
	estimatedRequestsPerHour: number,
	category: ProjectCategory,
	region: RegionId,
	campaignProne: boolean,
	campaign?: CampaignWindow,
): ProjectInitial {
	return {
		id,
		estimatedRequestsPerHour,
		status: "offered",
		demand: "shaped",
		category,
		region,
		campaignProne,
		commercial: {
			...commercialTermsForCategory(category),
			...(OPENING_TARGET_PPM[id] === undefined ? {} : { targetPpm: OPENING_TARGET_PPM[id] }),
		},
		...(campaign === undefined ? {} : { campaign }),
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

export const openingInitial: GameInitial = {
	customers: [
		{
			id: "acme",
			projects: [
				shapedProject("acme-web", 2_000, "shopping", "utc+0", true, {
					startHour: 24,
					durationHours: 48,
				}),
				shapedProject("acme-api", 500, "saas", "utc+1", false),
				shapedProject("acme-jobs", 300, "portfolio", "utc-5", false),
			],
		},
		{
			id: "northwind",
			projects: [
				shapedProject("northwind-shop", 600, "shopping", "utc+1", true),
				shapedProject("northwind-search", 450, "saas", "utc+0", false),
				shapedProject("northwind-reports", 350, "portfolio", "utc+9", false),
			],
		},
		{
			id: "globex",
			projects: [
				shapedProject("globex-portal", 700, "saas", "utc+0", true, {
					startHour: 0,
					durationHours: 12,
				}),
				shapedProject("globex-billing", 250, "shopping", "utc+0", false),
			],
		},
		{
			id: "initech",
			projects: [
				shapedProject("initech-tps", 200, "portfolio", "utc+0", false),
				shapedProject("initech-cover", 150, "saas", "utc+9", false),
			],
		},
	],
	assets: [],
};

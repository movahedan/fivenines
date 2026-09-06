import type { RegionId } from "./catalog/regions";
import type { GameInitial } from "./game";
import type { CampaignWindow, ProjectCategory, ProjectInitial, ProjectStatus } from "./project";

export function constantProject(
	id: string,
	estimatedRequestsPerHour: number,
	status: ProjectStatus,
): ProjectInitial {
	return {
		id,
		estimatedRequestsPerHour,
		status,
		demand: "constant",
		category: "saas",
		region: "utc+0",
		campaignProne: false,
	};
}

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
		...(campaign === undefined ? {} : { campaign }),
	};
}

const twoServedProjects = [
	constantProject("project-1", 700, "served"),
	constantProject("project-2", 700, "served"),
];

export const oneBronzeInitial: GameInitial = {
	customers: [
		{
			id: "customer-1",
			projects: twoServedProjects,
		},
	],
	assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
};

export const twoBronzeInitial: GameInitial = {
	customers: oneBronzeInitial.customers,
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
				shapedProject("acme-web", 400, "shopping", "utc+0", true, {
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

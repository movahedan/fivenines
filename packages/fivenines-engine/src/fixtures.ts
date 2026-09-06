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
		timezoneHours: 0,
		campaignProne: false,
	};
}

function shapedProject(
	id: string,
	estimatedRequestsPerHour: number,
	category: ProjectCategory,
	timezoneHours: number,
	campaignProne: boolean,
	campaign?: CampaignWindow,
): ProjectInitial {
	return {
		id,
		estimatedRequestsPerHour,
		status: "offered",
		demand: "shaped",
		category,
		timezoneHours,
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
	assets: [{ kind: "server", id: "server-1", catalogId: "bronze" }],
};

export const twoBronzeInitial: GameInitial = {
	customers: oneBronzeInitial.customers,
	assets: [
		{ kind: "server", id: "server-1", catalogId: "bronze" },
		{ kind: "server", id: "server-2", catalogId: "bronze" },
	],
};

export const openingInitial: GameInitial = {
	customers: [
		{
			id: "acme",
			projects: [
				shapedProject("acme-web", 400, "shopping", 0, true, {
					startHour: 24,
					durationHours: 48,
				}),
				shapedProject("acme-api", 500, "saas", 1, false),
				shapedProject("acme-jobs", 300, "portfolio", -5, false),
			],
		},
		{
			id: "northwind",
			projects: [
				shapedProject("northwind-shop", 600, "shopping", 3, true),
				shapedProject("northwind-search", 450, "saas", 0, false),
				shapedProject("northwind-reports", 350, "portfolio", 8, false),
			],
		},
		{
			id: "globex",
			projects: [
				shapedProject("globex-portal", 700, "saas", -2, true, {
					startHour: 0,
					durationHours: 12,
				}),
				shapedProject("globex-billing", 250, "shopping", 0, false),
			],
		},
		{
			id: "initech",
			projects: [
				shapedProject("initech-tps", 200, "portfolio", 0, false),
				shapedProject("initech-cover", 150, "saas", 6, false),
			],
		},
	],
	assets: [],
};

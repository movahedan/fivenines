import type { GameInitial } from "./game";

const twoServedProjects = [
	{ id: "project-1", estimatedRequestsPerHour: 700, status: "served" as const },
	{ id: "project-2", estimatedRequestsPerHour: 700, status: "served" as const },
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
				{ id: "acme-web", estimatedRequestsPerHour: 400, status: "offered" },
				{ id: "acme-api", estimatedRequestsPerHour: 500, status: "offered" },
				{ id: "acme-jobs", estimatedRequestsPerHour: 300, status: "offered" },
			],
		},
		{
			id: "northwind",
			projects: [
				{ id: "northwind-shop", estimatedRequestsPerHour: 600, status: "offered" },
				{ id: "northwind-search", estimatedRequestsPerHour: 450, status: "offered" },
				{ id: "northwind-reports", estimatedRequestsPerHour: 350, status: "offered" },
			],
		},
		{
			id: "globex",
			projects: [
				{ id: "globex-portal", estimatedRequestsPerHour: 700, status: "offered" },
				{ id: "globex-billing", estimatedRequestsPerHour: 250, status: "offered" },
			],
		},
		{
			id: "initech",
			projects: [
				{ id: "initech-tps", estimatedRequestsPerHour: 200, status: "offered" },
				{ id: "initech-cover", estimatedRequestsPerHour: 150, status: "offered" },
			],
		},
	],
	assets: [],
};

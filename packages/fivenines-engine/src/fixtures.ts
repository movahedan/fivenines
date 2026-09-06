import type { GameInitial } from "./game";

const twoServedProjects = [
	{ id: "project-1", estimatedRequestsPerHour: 700, status: "served" as const },
	{ id: "project-2", estimatedRequestsPerHour: 700, status: "served" as const },
];

export const oneTinyInitial: GameInitial = {
	customers: [
		{
			id: "customer-1",
			projects: twoServedProjects,
		},
	],
	assets: [{ kind: "server", id: "server-1", catalogId: "tiny" }],
	projectRoutes: [],
	balancerPools: [],
};

export const twoTinyInitial: GameInitial = {
	customers: oneTinyInitial.customers,
	assets: [
		{ kind: "server", id: "server-1", catalogId: "tiny" },
		{ kind: "server", id: "server-2", catalogId: "tiny" },
	],
	projectRoutes: [],
	balancerPools: [],
};

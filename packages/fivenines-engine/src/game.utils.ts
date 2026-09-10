import { SKU_ECONOMY, salvageCents } from "./catalog/economy-policy";
import type { ServerCatalogId } from "./catalog/kernel";
import type { RegionId } from "./catalog/regions";
import { Customer } from "./customer";
import type { LearningSubject } from "./learning/board";
import type { Project, ProjectStatus } from "./project";
import { Server, type ServerTenure } from "./server";

export type AssetInitial = {
	kind: "server";
	id: string;
	catalogId: ServerCatalogId;
	region: RegionId;
	tenure?: ServerTenure;
};

export type GameAsset = Server;

export type EngineCommand =
	| { type: "acceptProject"; payload: { projectId: string; serverId: string } }
	| { type: "declineProject"; payload: { projectId: string } }
	| { type: "moveProject"; payload: { projectId: string; serverId: string } }
	| { type: "unassignProject"; payload: { projectId: string } }
	| { type: "assignProject"; payload: { projectId: string; serverId: string } }
	| { type: "buyServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
	| { type: "leaseServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
	| { type: "sellServer"; payload: { serverId: string } }
	| { type: "releaseServer"; payload: { serverId: string } }
	| { type: "enrollLearning"; payload: { subject: LearningSubject } }
	| { type: "pauseLearning"; payload: { enrollmentId: string } }
	| { type: "resumeLearning"; payload: { enrollmentId: string } }
	| { type: "cancelLearning"; payload: { enrollmentId: string } };

export interface GameGraph {
	readonly customers: readonly Customer[];
	readonly assets: readonly GameAsset[];
	readonly cashCents: number;
	readonly jailed: boolean;
}

export function applyCommand(graph: GameGraph, command: EngineCommand): GameGraph {
	switch (command.type) {
		case "acceptProject": {
			if (graph.jailed) {
				throw new Error("cannot acceptProject while jailed");
			}

			assertServerExists(graph.assets, command.payload.serverId);

			return {
				...graph,
				customers: mapProject(graph.customers, command.payload.projectId, "offered", (project) =>
					project.asServed(command.payload.serverId),
				),
			};
		}
		case "declineProject":
			return {
				...graph,
				customers: mapProject(graph.customers, command.payload.projectId, "offered", (project) =>
					project.asDeclined(),
				),
			};
		case "moveProject": {
			assertServerExists(graph.assets, command.payload.serverId);

			return {
				...graph,
				customers: mapProject(graph.customers, command.payload.projectId, "served", (project) =>
					project.asRoutedTo(command.payload.serverId),
				),
			};
		}
		case "unassignProject":
			return {
				...graph,
				customers: mapProject(graph.customers, command.payload.projectId, "served", (project) =>
					project.asOffline(),
				),
			};
		case "assignProject": {
			assertServerExists(graph.assets, command.payload.serverId);

			return {
				...graph,
				customers: mapProject(graph.customers, command.payload.projectId, "offline", (project) =>
					project.asRoutedTo(command.payload.serverId),
				),
			};
		}
		case "buyServer": {
			if (graph.jailed) {
				throw new Error("cannot buyServer while jailed");
			}

			const purchaseCents = SKU_ECONOMY[command.payload.serverType].purchaseCents;

			if (graph.cashCents < purchaseCents) {
				throw new Error(`insufficient cash: ${purchaseCents}`);
			}

			return {
				...graph,
				cashCents: postCashDelta(graph.cashCents, -purchaseCents),
				assets: addCatalogServer(graph.assets, command.payload, {
					kind: "owned",
					purchaseCents,
				}),
			};
		}
		case "leaseServer": {
			if (graph.jailed) {
				throw new Error("cannot leaseServer while jailed");
			}

			const hourlyCents = SKU_ECONOMY[command.payload.serverType].leaseHourlyCents;

			return {
				...graph,
				assets: addCatalogServer(graph.assets, command.payload, {
					kind: "leased",
					hourlyCents,
				}),
			};
		}
		case "sellServer": {
			const sold = assertServerExists(graph.assets, command.payload.serverId);

			if (sold.tenure.kind === "leased") {
				throw new Error(`server is leased: ${sold.id}`);
			}

			assertNoServedRoute(graph.customers, command.payload.serverId);

			return {
				...graph,
				cashCents: postCashDelta(graph.cashCents, salvageCents(sold.tenure.purchaseCents)),
				assets: removeServer(graph.assets, command.payload.serverId),
			};
		}
		case "releaseServer": {
			const released = assertServerExists(graph.assets, command.payload.serverId);

			if (released.tenure.kind === "owned") {
				throw new Error(`server is owned: ${released.id}`);
			}

			assertNoServedRoute(graph.customers, command.payload.serverId);

			return {
				...graph,
				assets: removeServer(graph.assets, command.payload.serverId),
			};
		}
		default: {
			throw new Error(`unknown command type: ${String((command as { type: unknown }).type)}`);
		}
	}
}

export function postCashDelta(cashCents: number, delta: number): number {
	return cashCents + delta;
}

export function createAsset(initial: AssetInitial): GameAsset {
	return new Server({
		id: initial.id,
		catalogId: initial.catalogId,
		region: initial.region,
		tenure:
			initial.tenure ??
			({
				kind: "owned",
				purchaseCents: SKU_ECONOMY[initial.catalogId].purchaseCents,
			} satisfies ServerTenure),
	});
}

function assertServerExists(assets: readonly GameAsset[], serverId: string): GameAsset {
	const server = assets.find((asset) => asset.id === serverId);

	if (server === undefined) {
		throw new Error(`unknown server id: ${serverId}`);
	}

	return server;
}

/**
 * Every route must name a box the game still owns. Pure over the candidate graph
 * so callers can check a command's result before committing it.
 */
export function assertRoutesResolve(
	customers: readonly Customer[],
	assets: readonly GameAsset[],
): void {
	const serverIds = new Set(assets.map((asset) => asset.id));

	for (const customer of customers) {
		for (const project of customer.projects) {
			const route = project.route;

			if (route !== undefined && !serverIds.has(route.serverId)) {
				throw new Error(`unknown server id for project route: ${project.id}`);
			}
		}
	}
}

/** A parked project does not pin its old box — only a live route blocks the sale. */
function assertNoServedRoute(customers: readonly Customer[], serverId: string): void {
	for (const customer of customers) {
		for (const project of customer.projects) {
			if (project.status === "served" && project.route?.serverId === serverId) {
				throw new Error(`server has a served project routed to it: ${project.id}`);
			}
		}
	}
}

function mapProject(
	customers: readonly Customer[],
	projectId: string,
	requiredStatus: ProjectStatus,
	nextProject: (project: Project) => Project,
): readonly Customer[] {
	const current = findProject(customers, projectId);

	if (current.status !== requiredStatus) {
		throw new Error(`project is not ${requiredStatus}: ${current.id}`);
	}

	return customers.map((customer) => {
		if (!customer.projects.some((project) => project.id === projectId)) {
			return customer;
		}

		return new Customer(
			{ id: customer.id, projects: [] },
			customer.projects.map((project) =>
				project.id === projectId ? nextProject(project) : project,
			),
		);
	});
}

function addCatalogServer(
	assets: readonly GameAsset[],
	payload: { serverType: ServerCatalogId; region: RegionId },
	tenure: ServerTenure,
): readonly GameAsset[] {
	return [
		...assets,
		new Server({
			id: nextAssetId("server", assets),
			catalogId: payload.serverType,
			region: payload.region,
			tenure,
		}),
	];
}

function removeServer(assets: readonly GameAsset[], serverId: string): readonly GameAsset[] {
	return assets.filter((asset) => asset.id !== serverId);
}

function findProject(customers: readonly Customer[], projectId: string): Project {
	for (const customer of customers) {
		for (const project of customer.projects) {
			if (project.id === projectId) {
				return project;
			}
		}
	}

	throw new Error(`unknown project id: ${projectId}`);
}

function nextAssetId(prefix: string, assets: readonly GameAsset[]): string {
	const existing = new Set(assets.map((asset) => asset.id));
	let sequence = 1;

	while (existing.has(`${prefix}-${sequence}`)) {
		sequence += 1;
	}

	return `${prefix}-${sequence}`;
}

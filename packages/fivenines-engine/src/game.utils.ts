import type { ServerCatalogId } from "./catalog/kernel";
import type { RegionId } from "./catalog/regions";
import { Customer } from "./customer";
import type { Project, ProjectInitial } from "./project";
import { Server } from "./server";

export type AssetInitial = {
	kind: "server";
	id: string;
	catalogId: ServerCatalogId;
	region: RegionId;
};

export type GameAsset = Server;

export type EngineCommand =
	| { type: "acceptProject"; payload: { projectId: string } }
	| { type: "buyServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
	| { type: "sellServer"; payload: { serverId: string } };

export interface GameGraph {
	readonly customers: readonly Customer[];
	readonly assets: readonly GameAsset[];
}

export function applyCommand(graph: GameGraph, command: EngineCommand): GameGraph {
	switch (command.type) {
		case "acceptProject":
			return {
				...graph,
				customers: acceptProject(graph.customers, command.payload.projectId),
			};
		case "buyServer":
			return {
				...graph,
				assets: buyServer(graph.assets, command.payload),
			};
		case "sellServer":
			return {
				...graph,
				assets: sellServer(graph.assets, command.payload.serverId),
			};
		default: {
			throw new Error(`unknown command type: ${String((command as { type: unknown }).type)}`);
		}
	}
}

export function createAsset(initial: AssetInitial): GameAsset {
	return new Server({ id: initial.id, catalogId: initial.catalogId, region: initial.region });
}

function acceptProject(customers: readonly Customer[], projectId: string): readonly Customer[] {
	const current = findProject(customers, projectId);

	if (current.status !== "offered") {
		throw new Error(`project is not offered: ${current.id}`);
	}

	return customers.map((customer) => {
		if (!customer.projects.some((project) => project.id === projectId)) {
			return customer;
		}

		return new Customer({
			id: customer.id,
			projects: customer.projects.map((project) =>
				project.id === projectId
					? { ...projectSnapshot(project), status: "served" }
					: projectSnapshot(project),
			),
		});
	});
}

function buyServer(
	assets: readonly GameAsset[],
	payload: { serverType: ServerCatalogId; region: RegionId },
): readonly GameAsset[] {
	return [
		...assets,
		new Server({
			id: nextAssetId("server", assets),
			catalogId: payload.serverType,
			region: payload.region,
		}),
	];
}

function sellServer(assets: readonly GameAsset[], serverId: string): readonly GameAsset[] {
	if (!assets.some((asset) => asset.id === serverId)) {
		throw new Error(`unknown server id: ${serverId}`);
	}

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

function projectSnapshot(project: Project): ProjectInitial {
	return {
		id: project.id,
		estimatedRequestsPerHour: project.estimatedRequestsPerHour,
		status: project.status,
		demand: project.demand,
		category: project.category,
		region: project.region,
		campaignProne: project.campaignProne,
		...(project.campaign === undefined ? {} : { campaign: project.campaign }),
	};
}

function nextAssetId(prefix: string, assets: readonly GameAsset[]): string {
	const existing = new Set(assets.map((asset) => asset.id));
	let sequence = 1;

	while (existing.has(`${prefix}-${sequence}`)) {
		sequence += 1;
	}

	return `${prefix}-${sequence}`;
}

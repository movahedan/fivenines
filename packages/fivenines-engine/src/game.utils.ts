import {
	type BalancerPoolInitial,
	collectBalancerPools,
	collectProjectRoutes,
	type ProjectRouteInitial,
} from "./attachments";
import { Customer } from "./customer";
import { LoadBalancer } from "./load-balancer";
import type { Project, ProjectInitial } from "./project";
import { Server } from "./server";

export type AssetInitial =
	| { kind: "server"; id: string; catalogId: "tiny" }
	| { kind: "loadBalancer"; id: string };

export type GameAsset = Server | LoadBalancer;

export type EngineCommand =
	| { type: "acceptProject"; payload: { projectId: string } }
	| { type: "buyServer"; payload: { serverType: "tiny" } }
	| { type: "buyLoadBalancer" }
	| { type: "attachProject"; payload: { projectId: string; loadBalancerId: string } }
	| { type: "attachServer"; payload: { loadBalancerId: string; serverId: string } };

export interface GameGraph {
	readonly customers: readonly Customer[];
	readonly assets: readonly GameAsset[];
	readonly projectRoutes: readonly ProjectRouteInitial[];
	readonly balancerPools: readonly BalancerPoolInitial[];
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
				assets: buyServer(graph.assets, command.payload.serverType),
			};
		case "buyLoadBalancer":
			return {
				...graph,
				assets: buyLoadBalancer(graph.assets),
			};
		case "attachProject":
			return {
				...graph,
				projectRoutes: attachProject(
					graph,
					command.payload.projectId,
					command.payload.loadBalancerId,
				),
			};
		case "attachServer":
			return {
				...graph,
				balancerPools: attachServer(
					graph,
					command.payload.loadBalancerId,
					command.payload.serverId,
				),
			};
		default: {
			throw new Error(`unknown command type: ${String((command as { type: unknown }).type)}`);
		}
	}
}

export function createAsset(initial: AssetInitial): GameAsset {
	if (initial.kind === "server") {
		return new Server({ id: initial.id, catalogId: initial.catalogId });
	}

	return new LoadBalancer({ id: initial.id });
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

function buyServer(assets: readonly GameAsset[], serverType: "tiny"): readonly GameAsset[] {
	return [...assets, new Server({ id: nextAssetId("server", assets), catalogId: serverType })];
}

function buyLoadBalancer(assets: readonly GameAsset[]): readonly GameAsset[] {
	return [...assets, new LoadBalancer({ id: nextAssetId("lb", assets) })];
}

function attachProject(
	graph: GameGraph,
	projectId: string,
	loadBalancerId: string,
): readonly ProjectRouteInitial[] {
	return collectProjectRoutes(
		[...graph.projectRoutes, { projectId, loadBalancerId }],
		projectIds(graph.customers),
		assetIdsByKind(graph.assets, "loadBalancer"),
	);
}

function attachServer(
	graph: GameGraph,
	loadBalancerId: string,
	serverId: string,
): readonly BalancerPoolInitial[] {
	return collectBalancerPools(
		[...graph.balancerPools, { loadBalancerId, serverId }],
		assetIdsByKind(graph.assets, "loadBalancer"),
		assetIdsByKind(graph.assets, "server"),
	);
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
	};
}

function projectIds(customers: readonly Customer[]): Set<string> {
	return new Set(customers.flatMap((customer) => customer.projects.map((project) => project.id)));
}

function assetIdsByKind(assets: readonly GameAsset[], kind: GameAsset["kind"]): Set<string> {
	return new Set(assets.filter((asset) => asset.kind === kind).map((asset) => asset.id));
}

function nextAssetId(prefix: string, assets: readonly GameAsset[]): string {
	const existing = new Set(assets.map((asset) => asset.id));
	let sequence = 1;

	while (existing.has(`${prefix}-${sequence}`)) {
		sequence += 1;
	}

	return `${prefix}-${sequence}`;
}

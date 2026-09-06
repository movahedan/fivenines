import { units } from "@packages/utils/units";

import {
	assertUniqueIds,
	type BalancerPoolInitial,
	collectBalancerPools,
	collectProjectRoutes,
	type ProjectRouteInitial,
} from "./attachments";
import { Customer, type CustomerInitial } from "./customer";
import { assignDemandByCpuCap, LoadBalancer } from "./load-balancer";
import { Server } from "./server";

export type AssetInitial =
	| { kind: "server"; id: string; catalogId: "tiny" }
	| { kind: "loadBalancer"; id: string };

export type GameAsset = Server | LoadBalancer;

export interface GameInitial {
	customers: readonly CustomerInitial[];
	assets: readonly AssetInitial[];
	projectRoutes: readonly ProjectRouteInitial[];
	balancerPools: readonly BalancerPoolInitial[];
}

export interface GameTickMetrics {
	handledRequests: number;
	droppedRequests: number;
	p95LatencyMs: number;
	utilization: number;
	errorPpm: number;
}

const EMPTY_METRICS: GameTickMetrics = {
	handledRequests: 0,
	droppedRequests: 0,
	p95LatencyMs: 0,
	utilization: 0,
	errorPpm: 0,
};

export class Game {
	readonly customers: readonly Customer[];
	readonly assets: readonly GameAsset[];
	readonly projectRoutes: readonly ProjectRouteInitial[];
	readonly balancerPools: readonly BalancerPoolInitial[];

	#metrics: GameTickMetrics = EMPTY_METRICS;
	#loadBalancersById: ReadonlyMap<string, LoadBalancer>;
	#serversById: ReadonlyMap<string, Server>;
	#poolServerIdsByLoadBalancer: ReadonlyMap<string, readonly string[]>;
	#defaultPoolServers: readonly Server[];
	#routeByProjectId: ReadonlyMap<string, string>;

	constructor(initial: GameInitial) {
		const customerIds = initial.customers.map((customer) => customer.id);
		const projectIds = initial.customers.flatMap((customer) =>
			customer.projects.map((project) => project.id),
		);
		const assetIds = initial.assets.map((asset) => asset.id);

		assertUniqueIds(customerIds, "customer");
		assertUniqueIds(projectIds, "project");
		assertUniqueIds(assetIds, "asset");

		const loadBalancerIds = new Set(
			initial.assets.filter((asset) => asset.kind === "loadBalancer").map((asset) => asset.id),
		);
		const serverIds = new Set(
			initial.assets.filter((asset) => asset.kind === "server").map((asset) => asset.id),
		);

		this.projectRoutes = collectProjectRoutes(
			initial.projectRoutes,
			new Set(projectIds),
			loadBalancerIds,
		);
		this.balancerPools = collectBalancerPools(initial.balancerPools, loadBalancerIds, serverIds);

		this.customers = initial.customers.map((customer) => new Customer(customer));
		this.assets = initial.assets.map((asset) => createAsset(asset));

		const serversById = new Map<string, Server>();
		const loadBalancersById = new Map<string, LoadBalancer>();

		for (const asset of this.assets) {
			if (asset.kind === "server") {
				serversById.set(asset.id, asset);
			} else {
				loadBalancersById.set(asset.id, asset);
			}
		}

		this.#serversById = serversById;
		this.#loadBalancersById = loadBalancersById;
		this.#poolServerIdsByLoadBalancer = groupPoolServerIds(this.balancerPools);
		this.#routeByProjectId = new Map(
			this.projectRoutes.map((route) => [route.projectId, route.loadBalancerId]),
		);

		const pooledServerIds = new Set(this.balancerPools.map((pool) => pool.serverId));

		this.#defaultPoolServers = [...serversById.values()].filter(
			(server) => !pooledServerIds.has(server.id),
		);
	}

	get servers(): readonly Server[] {
		return [...this.#serversById.values()];
	}

	get metrics(): GameTickMetrics {
		return this.#metrics;
	}

	tick(): Game {
		for (const server of this.#serversById.values()) {
			server.assignDemand(0);
		}

		const demandByLoadBalancer = new Map<string, number>();
		let defaultPoolDemand = 0;
		let totalDemand = 0;

		for (const customer of this.customers) {
			for (const project of customer.projects) {
				const demand = project.tick();

				totalDemand += demand;

				if (demand === 0) {
					continue;
				}

				const loadBalancerId = this.#routeByProjectId.get(project.id);

				if (loadBalancerId === undefined) {
					defaultPoolDemand += demand;
					continue;
				}

				demandByLoadBalancer.set(
					loadBalancerId,
					(demandByLoadBalancer.get(loadBalancerId) ?? 0) + demand,
				);
			}
		}

		let unroutableDemand = 0;

		for (const [loadBalancerId, demand] of demandByLoadBalancer) {
			const loadBalancer = this.#loadBalancersById.get(loadBalancerId);
			const poolServers = this.#poolServers(loadBalancerId);

			if (loadBalancer === undefined || poolServers.length === 0) {
				unroutableDemand += demand;
				continue;
			}

			loadBalancer.tick(poolServers, demand);
		}

		if (defaultPoolDemand > 0) {
			if (this.#defaultPoolServers.length === 0) {
				unroutableDemand += defaultPoolDemand;
			} else {
				assignDemandByCpuCap(this.#defaultPoolServers, defaultPoolDemand);
			}
		}

		for (const server of this.#serversById.values()) {
			server.tick();
		}

		this.#metrics = rollUp([...this.#serversById.values()], totalDemand, unroutableDemand);

		return this;
	}

	#poolServers(loadBalancerId: string): readonly Server[] {
		const serverIds = this.#poolServerIdsByLoadBalancer.get(loadBalancerId) ?? [];
		const servers: Server[] = [];

		for (const serverId of serverIds) {
			const server = this.#serversById.get(serverId);

			if (server !== undefined) {
				servers.push(server);
			}
		}

		return servers;
	}
}

function createAsset(initial: AssetInitial): GameAsset {
	if (initial.kind === "server") {
		return new Server({ id: initial.id, catalogId: initial.catalogId });
	}

	return new LoadBalancer({ id: initial.id });
}

function groupPoolServerIds(
	pools: readonly BalancerPoolInitial[],
): ReadonlyMap<string, readonly string[]> {
	const grouped = new Map<string, string[]>();

	for (const pool of pools) {
		const existing = grouped.get(pool.loadBalancerId);

		if (existing === undefined) {
			grouped.set(pool.loadBalancerId, [pool.serverId]);
			continue;
		}

		existing.push(pool.serverId);
	}

	return grouped;
}

function rollUp(
	servers: readonly Server[],
	demandRequests: number,
	unroutableDemand: number,
): GameTickMetrics {
	if (servers.length === 0) {
		return {
			handledRequests: 0,
			droppedRequests: unroutableDemand,
			p95LatencyMs: 0,
			utilization: 0,
			errorPpm: units.partsPerMillion(unroutableDemand, demandRequests),
		};
	}

	let handledRequests = 0;
	let droppedRequests = unroutableDemand;
	let p95LatencyMs = 0;
	let utilization = 0;

	for (const server of servers) {
		const snapshot = server.metrics;

		handledRequests += snapshot.handledRequests;
		droppedRequests += snapshot.droppedRequests;
		p95LatencyMs = Math.max(p95LatencyMs, snapshot.p95LatencyMs);
		utilization = Math.max(utilization, snapshot.utilization);
	}

	return {
		handledRequests,
		droppedRequests,
		p95LatencyMs,
		utilization,
		errorPpm: units.partsPerMillion(droppedRequests, demandRequests),
	};
}

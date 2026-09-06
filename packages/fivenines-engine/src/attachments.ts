export interface ProjectRouteInitial {
	projectId: string;
	loadBalancerId: string;
}

export interface BalancerPoolInitial {
	loadBalancerId: string;
	serverId: string;
}

export function assertUniqueIds(ids: readonly string[], label: string): void {
	const seen = new Set<string>();

	for (const id of ids) {
		if (seen.has(id)) {
			throw new Error(`duplicate ${label} id: ${id}`);
		}

		seen.add(id);
	}
}

export function assertKnownId(id: string, known: ReadonlySet<string>, label: string): void {
	if (!known.has(id)) {
		throw new Error(`unknown ${label} id: ${id}`);
	}
}

export function collectProjectRoutes(
	routes: readonly ProjectRouteInitial[],
	projectIds: ReadonlySet<string>,
	loadBalancerIds: ReadonlySet<string>,
): readonly ProjectRouteInitial[] {
	const routedProjects = new Set<string>();

	for (const route of routes) {
		assertKnownId(route.projectId, projectIds, "project");
		assertKnownId(route.loadBalancerId, loadBalancerIds, "loadBalancer");

		if (routedProjects.has(route.projectId)) {
			throw new Error(`duplicate project route: ${route.projectId}`);
		}

		routedProjects.add(route.projectId);
	}

	return routes;
}

export function collectBalancerPools(
	pools: readonly BalancerPoolInitial[],
	loadBalancerIds: ReadonlySet<string>,
	serverIds: ReadonlySet<string>,
): readonly BalancerPoolInitial[] {
	const pooledServers = new Set<string>();

	for (const pool of pools) {
		assertKnownId(pool.loadBalancerId, loadBalancerIds, "loadBalancer");
		assertKnownId(pool.serverId, serverIds, "server");

		if (pooledServers.has(pool.serverId)) {
			throw new Error(`server attached to multiple load balancers: ${pool.serverId}`);
		}

		pooledServers.add(pool.serverId);
	}

	return pools;
}

import { type IdentityRecord, IdentityRegistry } from "../identity/registry";

export type InstanceHealth = "ok" | "degraded" | "down";
export type InstanceReadiness = "pending" | "ready";

export interface ServiceConfig {
	technologyId: string | null;
	settings: Readonly<Record<string, string>>;
}

export interface SharedAsset {
	id: string;
	ownerId: string;
}

export interface ProjectService {
	id: string;
	projectId: string;
	config: ServiceConfig;
}

export interface DeploymentInstance {
	id: string;
	serviceId: string;
	hostAssetId: string;
	health: InstanceHealth;
	readiness: InstanceReadiness;
}

export type TopologyMutation =
	| { type: "addAsset"; payload: { id: string; ownerId: string } }
	| { type: "addService"; payload: { id: string; projectId: string; config: ServiceConfig } }
	| { type: "addInstance"; payload: DeploymentInstance }
	| { type: "setInstanceHost"; payload: { instanceId: string; hostAssetId: string } }
	| { type: "setInstanceHealth"; payload: { instanceId: string; health: InstanceHealth } }
	| {
			type: "replaceServiceConfig";
			payload: { serviceId: string; config: ServiceConfig };
	  }
	| { type: "addDependency"; payload: { fromServiceId: string; toServiceId: string } };

interface TopologySnapshot {
	registry: IdentityRegistry;
	assets: Map<string, SharedAsset>;
	services: Map<string, ProjectService>;
	instances: Map<string, DeploymentInstance>;
	dependencies: Map<string, string[]>;
}

export class TopologyGraph {
	#registry: IdentityRegistry;
	#assets = new Map<string, SharedAsset>();
	#services = new Map<string, ProjectService>();
	#instances = new Map<string, DeploymentInstance>();
	#dependencies = new Map<string, string[]>();
	#instancesByAsset = new Map<string, readonly string[]>();
	#indexGeneration = 0;

	constructor(registry: IdentityRegistry = new IdentityRegistry()) {
		this.#registry = registry;
		this.#rebuildIndexes();
	}

	seedIdentities(records: readonly IdentityRecord[]): void {
		this.#registry.registerAll(records);
	}

	apply(mutation: TopologyMutation): void {
		const snapshot = this.#capture();

		try {
			this.#apply(mutation);
			this.#rebuildIndexes();
		} catch (error) {
			this.#restore(snapshot);
			throw error;
		}
	}

	asset(id: string): SharedAsset {
		return requireEntry(this.#assets, id, "asset");
	}

	service(id: string): ProjectService {
		return requireEntry(this.#services, id, "service");
	}

	instance(id: string): DeploymentInstance {
		return requireEntry(this.#instances, id, "instance");
	}

	instancesOnAsset(assetId: string): readonly string[] {
		return this.#instancesByAsset.get(assetId) ?? [];
	}

	indexGeneration(): number {
		return this.#indexGeneration;
	}

	#apply(mutation: TopologyMutation): void {
		switch (mutation.type) {
			case "addAsset":
				this.#registry.register({
					kind: "asset",
					id: mutation.payload.id,
					ownerId: mutation.payload.ownerId,
				});
				this.#assets.set(mutation.payload.id, mutation.payload);
				return;
			case "addService":
				this.#registry.get("project", mutation.payload.projectId);
				this.#registry.register({
					kind: "service",
					id: mutation.payload.id,
					ownerId: mutation.payload.projectId,
				});
				this.#services.set(mutation.payload.id, {
					id: mutation.payload.id,
					projectId: mutation.payload.projectId,
					config: mutation.payload.config,
				});
				return;
			case "addInstance": {
				this.#registry.get("service", mutation.payload.serviceId);
				this.#requireAsset(mutation.payload.hostAssetId);
				this.#registry.register({
					kind: "instance",
					id: mutation.payload.id,
					ownerId: mutation.payload.serviceId,
				});
				this.#instances.set(mutation.payload.id, { ...mutation.payload });
				return;
			}
			case "setInstanceHost": {
				const current = requireEntry(this.#instances, mutation.payload.instanceId, "instance");
				this.#requireAsset(mutation.payload.hostAssetId);
				this.#instances.set(mutation.payload.instanceId, {
					...current,
					hostAssetId: mutation.payload.hostAssetId,
				});
				return;
			}
			case "setInstanceHealth": {
				const current = requireEntry(this.#instances, mutation.payload.instanceId, "instance");
				this.#instances.set(mutation.payload.instanceId, {
					...current,
					health: mutation.payload.health,
				});
				return;
			}
			case "replaceServiceConfig": {
				const current = requireEntry(this.#services, mutation.payload.serviceId, "service");
				this.#services.set(mutation.payload.serviceId, {
					...current,
					config: mutation.payload.config,
				});
				return;
			}
			case "addDependency": {
				this.#registry.get("service", mutation.payload.fromServiceId);
				this.#registry.get("service", mutation.payload.toServiceId);

				if (mutation.payload.fromServiceId === mutation.payload.toServiceId) {
					throw new Error(`dependency cycle: ${mutation.payload.fromServiceId}`);
				}

				const next = new Map(this.#dependencies);
				const existing = next.get(mutation.payload.fromServiceId) ?? [];
				next.set(mutation.payload.fromServiceId, [...existing, mutation.payload.toServiceId]);
				assertAcyclic(next);
				this.#dependencies = next;
				return;
			}
			default: {
				const exhaustive: never = mutation;
				throw new Error(`unknown topology mutation: ${JSON.stringify(exhaustive)}`);
			}
		}
	}

	#requireAsset(id: string): SharedAsset {
		this.#registry.get("asset", id);
		return requireEntry(this.#assets, id, "asset");
	}

	#rebuildIndexes(): void {
		const instancesByAsset = new Map<string, string[]>();

		for (const instance of this.#instances.values()) {
			const hosted = instancesByAsset.get(instance.hostAssetId);

			if (hosted === undefined) {
				instancesByAsset.set(instance.hostAssetId, [instance.id]);
			} else {
				hosted.push(instance.id);
			}
		}

		this.#instancesByAsset = instancesByAsset;
		this.#indexGeneration += 1;
	}

	#capture(): TopologySnapshot {
		return {
			registry: this.#registry.clone(),
			assets: new Map(this.#assets),
			services: new Map(this.#services),
			instances: new Map(this.#instances),
			dependencies: new Map([...this.#dependencies.entries()].map(([from, to]) => [from, [...to]])),
		};
	}

	#restore(snapshot: TopologySnapshot): void {
		this.#registry = snapshot.registry;
		this.#assets = snapshot.assets;
		this.#services = snapshot.services;
		this.#instances = snapshot.instances;
		this.#dependencies = snapshot.dependencies;
		this.#rebuildIndexes();
		this.#indexGeneration -= 1;
	}
}

function requireEntry<T>(table: Map<string, T>, id: string, label: string): T {
	const value = table.get(id);

	if (value === undefined) {
		throw new Error(`unknown ${label} id: ${id}`);
	}

	return value;
}

function assertAcyclic(dependencies: Map<string, readonly string[]>): void {
	const visiting = new Set<string>();
	const visited = new Set<string>();

	const walk = (id: string, path: string[]): void => {
		if (visited.has(id)) {
			return;
		}

		if (visiting.has(id)) {
			throw new Error(`dependency cycle: ${[...path, id].join(" -> ")}`);
		}

		visiting.add(id);

		for (const next of dependencies.get(id) ?? []) {
			walk(next, [...path, id]);
		}

		visiting.delete(id);
		visited.add(id);
	};

	for (const id of dependencies.keys()) {
		walk(id, []);
	}
}

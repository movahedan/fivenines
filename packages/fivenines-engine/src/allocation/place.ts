import { APPOINTMENT_SITE_BASELINE } from "../catalog/acquaintance-offer";
import { ALLOCATION_POLICY } from "../catalog/allocation-policy";
import { CAPACITY_POLICY } from "../catalog/capacity-policy";
import { DEMAND_COST_MICRO, type DemandTypeId, demandTypeById } from "../catalog/demand-types";
import type { DemandBatch } from "../demand-engine/engine";
import { DemandEngine } from "../demand-engine/engine";
import type { QueueCohort } from "../demand-engine/queue";
import { WorkQueue } from "../demand-engine/queue";
import type { Project } from "../project";
import type { Server } from "../server";
import type { RandomSource } from "../traffic/random-source";
import { compileDemandGraph } from "../work/compile";
import {
	categoryPathHour,
	demandTypePathHour,
	EMPTY_PATH_HOUR,
	mergePathHours,
	type PathHourSummary,
} from "../work/execute";
import { assertConserved, settleHostTick, type WorkItem, type WorkSettlement } from "../work/share";
import type { WorkDimension } from "../work/units";

export interface PlacedDemand {
	readonly projects: readonly Project[];
	readonly totalDemand: number;
	readonly unroutableDemand: number;
	readonly paths: PathHourSummary;
}

interface ItemMeta {
	readonly projectId: string;
	readonly requests: number;
	readonly cost: number;
	readonly nodeId: string | undefined;
	readonly optional: boolean;
	readonly demandTypeId: DemandTypeId | undefined;
	readonly arrivalHour: number;
}

export interface AllocateHourInput {
	readonly hour: number;
	readonly rng: RandomSource;
	readonly projects: readonly Project[];
	readonly serversById: ReadonlyMap<string, Server>;
	readonly queues: Map<string, WorkQueue>;
	readonly engines: Map<string, DemandEngine>;
}

interface ProjectPlacement {
	readonly project: Project;
	readonly emitted: number;
	readonly server: Server | undefined;
	readonly batches: readonly DemandBatch[];
}

export function queueForProject(
	projectId: string,
	server: Server,
	queues: Map<string, WorkQueue>,
): WorkQueue {
	const key = `${server.id}:${projectId}`;
	const existing = queues.get(key);

	if (existing !== undefined) {
		return existing;
	}

	const queue = new WorkQueue(
		Math.floor((server.memoryMiB * ALLOCATION_POLICY.queuedMemoryReservePercent) / 100) * 1024,
	);
	queues.set(key, queue);

	return queue;
}

export function demandEngineFor(
	project: Project,
	engines: Map<string, DemandEngine>,
	rng: RandomSource,
): DemandEngine | undefined {
	if (
		project.demand !== "shaped" ||
		project.category !== "saas" ||
		project.estimatedRequestsPerHour !== APPOINTMENT_SITE_BASELINE
	) {
		return undefined;
	}

	const existing = engines.get(project.id);

	if (existing !== undefined) {
		existing.setActive(project.status === "served" || project.status === "offline");

		return existing;
	}

	const engine = DemandEngine.hourly(ALLOCATION_POLICY.appointmentTemplateId, {
		projectId: project.id,
		region: project.region,
		random: rng,
		active: project.status === "served" || project.status === "offline",
		constant: false,
		scheduledCampaign: project.campaign,
	});
	engines.set(project.id, engine);

	return engine;
}

export function allocateHour(input: AllocateHourInput): PlacedDemand {
	let totalDemand = 0;
	let unroutableDemand = 0;
	let paths = EMPTY_PATH_HOUR;
	const byServer = new Map<string, ProjectPlacement[]>();

	for (const project of input.projects) {
		const engine = demandEngineFor(project, input.engines, input.rng);
		const generated = engine?.generate(input.hour);
		const emitted =
			generated === undefined
				? project.tick(input.hour, input.rng)
				: project.recordEmitted(generated.totalCount);

		totalDemand += emitted;

		if (emitted === 0) {
			continue;
		}

		const route = project.route;
		const server = route === undefined ? undefined : input.serversById.get(route.serverId);

		if (server === undefined || !server.poweredOn) {
			unroutableDemand += emitted;
			paths = mergePathHours(paths, categoryPathHour(0, emitted));
			continue;
		}

		const row: ProjectPlacement = {
			project,
			emitted,
			server,
			batches: generated?.batches ?? [],
		};
		const group = byServer.get(server.id) ?? [];
		group.push(row);
		byServer.set(server.id, group);
	}

	for (const [serverId, group] of byServer) {
		const server = input.serversById.get(serverId);

		if (server === undefined) {
			continue;
		}

		const settled = settleServerHour(input.hour, server, group, input.queues);
		unroutableDemand += settled.unroutable;
		paths = mergePathHours(paths, settled.paths);
	}

	return {
		projects: input.projects,
		totalDemand,
		unroutableDemand,
		paths,
	};
}

function settleServerHour(
	hour: number,
	server: Server,
	group: readonly ProjectPlacement[],
	queues: Map<string, WorkQueue>,
): { unroutable: number; paths: PathHourSummary } {
	const items: WorkItem[] = [];
	const requestCostByItem = new Map<string, ItemMeta>();
	let retainedDiskMiB = 0;

	for (const row of group) {
		if (row.batches.length > 0) {
			const queue = queueForProject(row.project.id, server, queues);
			queue.admit(hour, row.batches);
			retainedDiskMiB += Math.ceil(queue.durableMemoryMicroMiB / DEMAND_COST_MICRO);

			for (const cohort of queue.cohorts()) {
				items.push(...itemsForDemandType(row.project.id, cohort, requestCostByItem));
			}
			continue;
		}

		items.push(...itemsForCategory(row, requestCostByItem));
	}

	const settlements = settleHostTick(server.hostBudget(retainedDiskMiB), items);
	assertConserved(items, settlements);
	const assignedByProject = assignedByProjectFromSettlements(items, settlements, requestCostByItem);

	for (const row of group) {
		const assigned = Math.min(row.emitted, assignedByProject.get(row.project.id) ?? 0);

		if (assigned > 0) {
			server.assignSlice({
				category: row.project.category,
				requests: assigned,
				sourceRegion: row.project.region,
				projectId: row.project.id,
			});
		}

		if (row.batches.length > 0) {
			applyQueueProgress(
				hour,
				queueForProject(row.project.id, server, queues),
				row.project.id,
				items,
				settlements,
				requestCostByItem,
			);
		}
	}

	let unroutable = 0;
	let paths = EMPTY_PATH_HOUR;

	for (const row of group) {
		const assigned = Math.min(row.emitted, assignedByProject.get(row.project.id) ?? 0);
		unroutable += row.emitted - assigned;

		if (row.batches.length === 0) {
			paths = mergePathHours(paths, categoryPathHour(assigned, row.emitted));
			continue;
		}

		paths = mergePathHours(
			paths,
			pathsForQueue(row.project.id, items, settlements, requestCostByItem),
		);
	}

	return { unroutable, paths };
}

function itemsForCategory(
	row: ProjectPlacement,
	requestCostByItem: Map<string, ItemMeta>,
): WorkItem[] {
	const cost = CAPACITY_POLICY.categories[row.project.category];
	const items: WorkItem[] = [];

	pushItem(
		items,
		requestCostByItem,
		row.project.id,
		"cpu",
		"cpuWork",
		row.emitted,
		cost.cpuPerRequest,
		0,
	);
	pushItem(
		items,
		requestCostByItem,
		row.project.id,
		"net",
		"networkMiB",
		row.emitted,
		cost.bytesPerRequest,
		0,
	);
	pushItem(
		items,
		requestCostByItem,
		row.project.id,
		"disk",
		"diskOps",
		row.emitted,
		cost.diskOpsPerRequest,
		0,
	);

	const inFlight = Math.floor((row.emitted * CAPACITY_POLICY.inflightPerThousandRequests) / 1000);
	const occupancy = inFlight * cost.memPerInflight;

	if (occupancy > 0) {
		pushItem(items, requestCostByItem, row.project.id, "ram", "residentMemoryMiB", occupancy, 1, 0);
	}

	return items;
}

function itemsForDemandType(
	projectId: string,
	cohort: QueueCohort,
	requestCostByItem: Map<string, ItemMeta>,
): WorkItem[] {
	const demandType = demandTypeById(cohort.demandTypeId);
	const demandTypeId = cohort.demandTypeId as DemandTypeId;
	const count = cohort.remainingCount;
	const prefix = `${cohort.demandTypeId}:${String(cohort.arrivalHour)}`;
	const items: WorkItem[] = [];
	const compiled = compileDemandGraph(demandTypeId);

	for (const node of compiled.nodeWork) {
		if (node.amountPerRequest <= 0) {
			continue;
		}

		pushItem(
			items,
			requestCostByItem,
			projectId,
			`${prefix}:${node.nodeId}:${node.dimension}`,
			node.dimension,
			count,
			node.amountPerRequest,
			cohort.arrivalHour,
			demandType.waitPolicy,
			node.gpuWorkPerRequest * count,
			node.gpuMemoryMiB,
			node.nodeId,
			node.optional,
			demandTypeId,
		);
	}

	const occupancy = microPerRequest(demandType.workingMemoryMicroMiB);

	if (occupancy > 0) {
		pushItem(
			items,
			requestCostByItem,
			projectId,
			`${prefix}:ram`,
			"residentMemoryMiB",
			count,
			occupancy,
			cohort.arrivalHour,
			demandType.waitPolicy,
		);
	}

	return items;
}

function microPerRequest(micro: number): number {
	return Math.max(0, Math.round(micro / DEMAND_COST_MICRO));
}

function pushItem(
	items: WorkItem[],
	requestCostByItem: Map<string, ItemMeta>,
	projectId: string,
	suffix: string,
	dimension: WorkDimension,
	requests: number,
	costPerRequest: number,
	arrivalTick: number,
	waitPolicy: WorkItem["waitPolicy"] = "interactive",
	gpuWork = 0,
	gpuMemoryMiB = 0,
	nodeId?: string,
	optional = false,
	demandTypeId?: DemandTypeId,
): void {
	if (costPerRequest <= 0 || requests <= 0) {
		return;
	}

	const id = `${projectId}:${suffix}`;
	items.push({
		id,
		projectId,
		arrivalTick,
		dimension,
		amount: requests * costPerRequest,
		gpuWork,
		gpuMemoryMiB,
		waitPolicy,
	});
	requestCostByItem.set(id, {
		projectId,
		requests,
		cost: costPerRequest,
		nodeId,
		optional,
		demandTypeId,
		arrivalHour: arrivalTick,
	});
}

function assignedByProjectFromSettlements(
	items: readonly WorkItem[],
	settlements: readonly WorkSettlement[],
	requestCostByItem: ReadonlyMap<string, ItemMeta>,
): Map<string, number> {
	const handledByItem = new Map(settlements.map((row) => [row.itemId, row] as const));
	const assigned = new Map<string, number>();

	for (const item of items) {
		const meta = requestCostByItem.get(item.id);

		if (
			meta === undefined ||
			meta.optional ||
			item.dimension === "residentMemoryMiB" ||
			item.dimension === "queuedMemoryMiB" ||
			item.dimension === "diskCapacityMiB"
		) {
			continue;
		}

		const settlement = handledByItem.get(item.id);
		const requests =
			settlement !== undefined && settlement.infeasible > 0
				? 0
				: Math.floor((settlement?.handled ?? 0) / meta.cost);
		const current = assigned.get(meta.projectId);
		assigned.set(meta.projectId, current === undefined ? requests : Math.min(current, requests));
	}

	return assigned;
}

function applyQueueProgress(
	hour: number,
	queue: WorkQueue,
	projectId: string,
	items: readonly WorkItem[],
	settlements: readonly WorkSettlement[],
	requestCostByItem: ReadonlyMap<string, ItemMeta>,
): void {
	const handledByItem = new Map(settlements.map((row) => [row.itemId, row.handled] as const));

	for (const cohort of [...queue.cohorts()]) {
		const required = items.filter((item) => {
			const meta = requestCostByItem.get(item.id);

			return (
				item.projectId === projectId &&
				meta?.demandTypeId === cohort.demandTypeId &&
				meta.arrivalHour === cohort.arrivalHour &&
				meta.optional === false &&
				(item.dimension === "cpuWork" || item.dimension === "gpuWork")
			);
		});
		const completed =
			required.length === 0
				? cohort.remainingCount
				: Math.min(
						cohort.remainingCount,
						...required.map((item) => {
							const meta = requestCostByItem.get(item.id);
							const cost = Math.max(meta?.cost ?? 1, 1);

							return Math.floor((handledByItem.get(item.id) ?? 0) / cost);
						}),
					);

		if (completed > 0) {
			queue.advance(hour, cohort.demandTypeId, cohort.arrivalHour, completed);
		}
	}

	queue.expire(hour);
}

function pathsForQueue(
	projectId: string,
	items: readonly WorkItem[],
	settlements: readonly WorkSettlement[],
	requestCostByItem: ReadonlyMap<string, ItemMeta>,
): PathHourSummary {
	let paths = EMPTY_PATH_HOUR;
	const handled = new Map(settlements.map((row) => [row.itemId, row] as const));
	const groups = new Map<
		string,
		{
			demandTypeId: DemandTypeId;
			waitPolicy: WorkItem["waitPolicy"];
			requests: number;
			byNode: Map<string, WorkSettlement[]>;
		}
	>();

	for (const item of items) {
		const meta = requestCostByItem.get(item.id);

		if (
			meta === undefined ||
			meta.projectId !== projectId ||
			meta.demandTypeId === undefined ||
			meta.nodeId === undefined
		) {
			continue;
		}

		const key = `${meta.demandTypeId}:${String(meta.arrivalHour)}`;
		const group = groups.get(key) ?? {
			demandTypeId: meta.demandTypeId,
			waitPolicy: item.waitPolicy,
			requests: meta.requests,
			byNode: new Map(),
		};
		const nodeRows = group.byNode.get(meta.nodeId) ?? [];
		const settlement = handled.get(item.id);

		if (settlement !== undefined) {
			nodeRows.push(settlement);
			group.byNode.set(meta.nodeId, nodeRows);
		}

		groups.set(key, group);
	}

	for (const group of groups.values()) {
		paths = mergePathHours(
			paths,
			demandTypePathHour(group.demandTypeId, group.waitPolicy, group.requests, group.byNode),
		);
	}

	return paths;
}

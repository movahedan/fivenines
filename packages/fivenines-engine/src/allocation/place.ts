import { APPOINTMENT_SITE_BASELINE } from "../catalog/acquaintance-offer";
import { ALLOCATION_POLICY } from "../catalog/allocation-policy";
import { CAPACITY_POLICY } from "../catalog/capacity-policy";
import { DEMAND_COST_MICRO, demandTypeById } from "../catalog/demand-types";
import type { DemandBatch } from "../demand-engine/engine";
import { DemandEngine } from "../demand-engine/engine";
import type { QueueCohort } from "../demand-engine/queue";
import { WorkQueue } from "../demand-engine/queue";
import type { Project } from "../project";
import type { Server } from "../server";
import type { RandomSource } from "../traffic/random-source";
import { assertConserved, settleHostTick, type WorkItem, type WorkSettlement } from "../work/share";
import type { WorkDimension } from "../work/units";

export interface PlacedDemand {
	readonly projects: readonly Project[];
	readonly totalDemand: number;
	readonly unroutableDemand: number;
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

		unroutableDemand += settleServerHour(input.hour, server, group, input.queues);
	}

	return {
		projects: input.projects,
		totalDemand,
		unroutableDemand,
	};
}

function settleServerHour(
	hour: number,
	server: Server,
	group: readonly ProjectPlacement[],
	queues: Map<string, WorkQueue>,
): number {
	const items: WorkItem[] = [];
	const requestCostByItem = new Map<
		string,
		{ projectId: string; requests: number; cost: number }
	>();
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
			);
		}
	}

	let unroutable = 0;

	for (const row of group) {
		const assigned = Math.min(row.emitted, assignedByProject.get(row.project.id) ?? 0);
		unroutable += row.emitted - assigned;
	}

	return unroutable;
}

function itemsForCategory(
	row: ProjectPlacement,
	requestCostByItem: Map<string, { projectId: string; requests: number; cost: number }>,
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
	requestCostByItem: Map<string, { projectId: string; requests: number; cost: number }>,
): WorkItem[] {
	const demandType = demandTypeById(cohort.demandTypeId);
	const count = cohort.remainingCount;
	const prefix = `${cohort.demandTypeId}:${String(cohort.arrivalHour)}`;
	const items: WorkItem[] = [];
	const cpuPerRequest = microPerRequest(
		demandType.applicationCpuWorkMicro + demandType.databaseCpuWorkMicro,
	);

	pushItem(
		items,
		requestCostByItem,
		projectId,
		`${prefix}:cpu`,
		"cpuWork",
		count,
		cpuPerRequest,
		cohort.arrivalHour,
		demandType.waitPolicy,
		demandType.gpuWorkMicro > 0 ? microPerRequest(demandType.gpuWorkMicro) * count : 0,
		demandType.gpuMemoryMiB,
	);
	pushItem(
		items,
		requestCostByItem,
		projectId,
		`${prefix}:net`,
		"networkMiB",
		count,
		microPerRequest(demandType.networkMicroMiB),
		cohort.arrivalHour,
		demandType.waitPolicy,
	);
	pushItem(
		items,
		requestCostByItem,
		projectId,
		`${prefix}:disk`,
		"diskOps",
		count,
		demandType.storageOperations,
		cohort.arrivalHour,
		demandType.waitPolicy,
	);
	pushItem(
		items,
		requestCostByItem,
		projectId,
		`${prefix}:ram`,
		"residentMemoryMiB",
		count,
		microPerRequest(demandType.workingMemoryMicroMiB),
		cohort.arrivalHour,
		demandType.waitPolicy,
	);

	if (demandType.gpuWorkMicro > 0 || demandType.gpuMemoryMiB > 0) {
		pushItem(
			items,
			requestCostByItem,
			projectId,
			`${prefix}:gpu`,
			"gpuWork",
			count,
			Math.max(1, microPerRequest(demandType.gpuWorkMicro)),
			cohort.arrivalHour,
			demandType.waitPolicy,
			microPerRequest(demandType.gpuWorkMicro) * count,
			demandType.gpuMemoryMiB,
		);
	}

	return items;
}

function microPerRequest(micro: number): number {
	return Math.max(0, Math.round(micro / DEMAND_COST_MICRO));
}

function pushItem(
	items: WorkItem[],
	requestCostByItem: Map<string, { projectId: string; requests: number; cost: number }>,
	projectId: string,
	suffix: string,
	dimension: WorkDimension,
	requests: number,
	costPerRequest: number,
	arrivalTick: number,
	waitPolicy: WorkItem["waitPolicy"] = "interactive",
	gpuWork = 0,
	gpuMemoryMiB = 0,
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
	requestCostByItem.set(id, { projectId, requests, cost: costPerRequest });
}

function assignedByProjectFromSettlements(
	items: readonly WorkItem[],
	settlements: readonly WorkSettlement[],
	requestCostByItem: ReadonlyMap<string, { projectId: string; requests: number; cost: number }>,
): Map<string, number> {
	const handledByItem = new Map(settlements.map((row) => [row.itemId, row] as const));
	const assigned = new Map<string, number>();

	for (const item of items) {
		const meta = requestCostByItem.get(item.id);

		if (
			meta === undefined ||
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
): void {
	const handledByItem = new Map(settlements.map((row) => [row.itemId, row.handled] as const));

	for (const cohort of [...queue.cohorts()]) {
		const cpuItem = items.find(
			(item) =>
				item.projectId === projectId &&
				item.id.includes(`:${cohort.demandTypeId}:${String(cohort.arrivalHour)}:cpu`),
		);
		const handled = cpuItem === undefined ? 0 : (handledByItem.get(cpuItem.id) ?? 0);
		const demandType = demandTypeById(cohort.demandTypeId);
		const cpuPerRequest = microPerRequest(
			demandType.applicationCpuWorkMicro + demandType.databaseCpuWorkMicro,
		);
		const completed =
			cpuPerRequest <= 0
				? cohort.remainingCount
				: Math.min(cohort.remainingCount, Math.floor(handled / Math.max(cpuPerRequest, 1)));

		if (completed > 0) {
			queue.advance(hour, cohort.demandTypeId, cohort.arrivalHour, completed);
		}
	}

	queue.expire(hour);
}

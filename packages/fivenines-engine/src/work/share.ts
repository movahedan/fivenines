import { conserveWork, type WorkBalance } from "./conservation";
import type { WorkDimension } from "./units";

export type WaitPolicy = "interactive" | "queued" | "continuous" | "job";

export interface HostBudget {
	cpuWork: number;
	gpuWork: number;
	gpuCount: number;
	gpuMemoryMiB: number;
	residentMemoryMiB: number;
	queuedMemoryMiB: number;
	diskCapacityMiB: number;
	diskOps: number;
	networkMiB: number;
}

export interface WorkItem {
	id: string;
	projectId: string;
	arrivalTick: number;
	dimension: WorkDimension;
	amount: number;
	gpuWork: number;
	gpuMemoryMiB: number;
	waitPolicy: WaitPolicy;
}

export interface WorkSettlement {
	itemId: string;
	projectId: string;
	handled: number;
	waiting: number;
	rejected: number;
	infeasible: number;
}

export function isInfeasible(item: WorkItem, host: HostBudget): boolean {
	if (item.gpuWork > 0 && host.gpuCount === 0) {
		return true;
	}

	if (item.gpuMemoryMiB > 0 && item.gpuMemoryMiB > host.gpuMemoryMiB) {
		return true;
	}

	return false;
}

export function allocateProportional(
	demands: ReadonlyMap<string, number>,
	capacity: number,
): Map<string, number> {
	const ids = [...demands.keys()].sort();
	const allocated = new Map<string, number>();
	const total = ids.reduce((sum, id) => sum + (demands.get(id) ?? 0), 0);

	if (total === 0 || capacity <= 0) {
		for (const id of ids) {
			allocated.set(id, 0);
		}

		return allocated;
	}

	if (total <= capacity) {
		for (const id of ids) {
			allocated.set(id, demands.get(id) ?? 0);
		}

		return allocated;
	}

	let used = 0;
	const remainders: { id: string; remainder: number }[] = [];

	for (const id of ids) {
		const demand = demands.get(id) ?? 0;
		const floor = Math.floor((capacity * demand) / total);
		allocated.set(id, floor);
		used += floor;
		remainders.push({ id, remainder: (capacity * demand) % total });
	}

	remainders.sort((left, right) => {
		if (right.remainder !== left.remainder) {
			return right.remainder - left.remainder;
		}

		return left.id.localeCompare(right.id);
	});

	let leftover = capacity - used;

	for (const row of remainders) {
		if (leftover <= 0) {
			break;
		}

		const demand = demands.get(row.id) ?? 0;
		const current = allocated.get(row.id) ?? 0;
		const room = demand - current;

		if (room <= 0) {
			continue;
		}

		allocated.set(row.id, current + 1);
		leftover -= 1;
	}

	return allocated;
}

export function settleHostTick(host: HostBudget, items: readonly WorkItem[]): WorkSettlement[] {
	const settlements: WorkSettlement[] = [];
	const eligible: WorkItem[] = [];

	for (const item of items) {
		if (isInfeasible(item, host)) {
			settlements.push({
				itemId: item.id,
				projectId: item.projectId,
				handled: 0,
				waiting: 0,
				rejected: 0,
				infeasible: item.amount,
			});
			continue;
		}

		eligible.push(item);
	}

	const byDimension = new Map<WorkDimension, WorkItem[]>();

	for (const item of eligible) {
		const group = byDimension.get(item.dimension) ?? [];
		group.push(item);
		byDimension.set(item.dimension, group);
	}

	for (const [dimension, group] of byDimension) {
		const demands = demandByProject(group);
		const shares = allocateProportional(demands, capacityOf(host, dimension));
		const byProject = groupByProject(group);

		for (const [projectId, projectItems] of byProject) {
			settlements.push(...consumeFifo(projectItems, shares.get(projectId) ?? 0));
		}
	}

	return settlements;
}

export function balanceSettlements(
	items: readonly WorkItem[],
	settlements: readonly WorkSettlement[],
): WorkBalance {
	const demanded = items.reduce((sum, item) => sum + item.amount, 0);
	const handled = settlements.reduce((sum, row) => sum + row.handled, 0);
	const waiting = settlements.reduce((sum, row) => sum + row.waiting, 0);
	const rejected = settlements.reduce((sum, row) => sum + row.rejected, 0);
	const infeasible = settlements.reduce((sum, row) => sum + row.infeasible, 0);

	return { demanded, handled, waiting, rejected, infeasible };
}

export function assertConserved(
	items: readonly WorkItem[],
	settlements: readonly WorkSettlement[],
): void {
	const balance = balanceSettlements(items, settlements);

	if (!conserveWork(balance)) {
		throw new Error(`work is not conserved: ${JSON.stringify(balance)}`);
	}
}

function capacityOf(host: HostBudget, dimension: WorkDimension): number {
	switch (dimension) {
		case "cpuWork":
			return host.cpuWork;
		case "gpuWork":
			return host.gpuWork;
		case "diskOps":
			return host.diskOps;
		case "networkMiB":
			return host.networkMiB;
		case "residentMemoryMiB":
			return host.residentMemoryMiB;
		case "queuedMemoryMiB":
			return host.queuedMemoryMiB;
		case "diskCapacityMiB":
			return host.diskCapacityMiB;
	}
}

function demandByProject(items: readonly WorkItem[]): Map<string, number> {
	const demands = new Map<string, number>();

	for (const item of items) {
		demands.set(item.projectId, (demands.get(item.projectId) ?? 0) + item.amount);
	}

	return demands;
}

function groupByProject(items: readonly WorkItem[]): Map<string, WorkItem[]> {
	const groups = new Map<string, WorkItem[]>();

	for (const item of items) {
		const group = groups.get(item.projectId) ?? [];
		group.push(item);
		groups.set(item.projectId, group);
	}

	return groups;
}

function consumeFifo(items: readonly WorkItem[], share: number): WorkSettlement[] {
	const ordered = [...items].sort((left, right) => {
		if (left.arrivalTick !== right.arrivalTick) {
			return left.arrivalTick - right.arrivalTick;
		}

		return left.id.localeCompare(right.id);
	});

	let remaining = share;
	const settlements: WorkSettlement[] = [];

	for (const item of ordered) {
		const handled = Math.min(item.amount, remaining);
		remaining -= handled;
		const leftover = item.amount - handled;
		const waiting = leftover > 0 && item.waitPolicy === "queued" ? leftover : 0;
		const rejected = leftover - waiting;

		settlements.push({
			itemId: item.id,
			projectId: item.projectId,
			handled,
			waiting,
			rejected,
			infeasible: 0,
		});
	}

	return settlements;
}

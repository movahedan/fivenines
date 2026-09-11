import { describe, expect, it } from "bun:test";

import { conserveWork } from "./conservation";
import {
	allocateProportional,
	assertConserved,
	balanceSettlements,
	type HostBudget,
	settleHostTick,
	type WorkItem,
} from "./share";

describe("work - proportional shares", () => {
	it("splits contended capacity by demand including backlog and ignores input order", () => {
		const forward = allocateProportional(
			new Map([
				["alpha", 20],
				["beta", 10],
			]),
			15,
		);
		const reversed = allocateProportional(
			new Map([
				["beta", 10],
				["alpha", 20],
			]),
			15,
		);

		expect(forward.get("alpha")).toBe(10);
		expect(forward.get("beta")).toBe(5);
		expect(reversed.get("alpha")).toBe(forward.get("alpha"));
		expect(reversed.get("beta")).toBe(forward.get("beta"));
	});

	it("uses largest remainder so rounding still sums to capacity", () => {
		const shares = allocateProportional(
			new Map([
				["alpha", 5],
				["beta", 5],
				["gamma", 5],
			]),
			10,
		);

		expect([...shares.values()].reduce((sum, value) => sum + value, 0)).toBe(10);
		expect(shares.get("alpha")).toBe(4);
		expect(shares.get("beta")).toBe(3);
		expect(shares.get("gamma")).toBe(3);
	});
});

describe("work - host settlement", () => {
	it("handles a CPU-bound hour and conserves demand", () => {
		const host = budget({ cpuWork: 10 });
		const items = [
			item("a-new", "alpha", 1, "cpuWork", 10),
			item("b-new", "beta", 1, "cpuWork", 10),
		];
		const settlements = settleHostTick(host, items);
		const balance = balanceSettlements(items, settlements);

		expect(balance.handled).toBe(10);
		expect(balance.rejected).toBe(10);
		expect(conserveWork(balance)).toBe(true);
	});

	it("processes older queued backlog first within a project share", () => {
		const host = budget({ cpuWork: 10 });
		const items = [
			item("new", "alpha", 2, "cpuWork", 10, { waitPolicy: "queued" }),
			item("old", "alpha", 0, "cpuWork", 10, { waitPolicy: "queued" }),
			item("beta", "beta", 1, "cpuWork", 10, { waitPolicy: "queued" }),
		];
		const settlements = settleHostTick(host, items);
		const byId = Object.fromEntries(settlements.map((row) => [row.itemId, row]));

		expect(byId.old?.handled).toBe(7);
		expect(byId.old?.waiting).toBe(3);
		expect(byId.new?.handled).toBe(0);
		expect(byId.new?.waiting).toBe(10);
		expect(byId.beta?.handled).toBe(3);
		assertConserved(items, settlements);
	});

	it("marks GPU work infeasible on a host with no GPU instead of spending CPU", () => {
		const host = budget({ cpuWork: 100, gpuCount: 0, gpuWork: 0 });
		const items = [item("train", "alpha", 0, "gpuWork", 80, { gpuWork: 80, gpuMemoryMiB: 4096 })];
		const settlements = settleHostTick(host, items);

		expect(settlements[0]?.infeasible).toBe(80);
		expect(settlements[0]?.handled).toBe(0);
		assertConserved(items, settlements);
	});

	it("settles memory, network, and disk bound hours on their own axes", () => {
		expect(
			balanceSettlements(
				[item("ram", "alpha", 0, "residentMemoryMiB", 80)],
				settleHostTick(budget({ residentMemoryMiB: 50 }), [
					item("ram", "alpha", 0, "residentMemoryMiB", 80),
				]),
			).handled,
		).toBe(50);
		expect(
			balanceSettlements(
				[item("net", "alpha", 0, "networkMiB", 80)],
				settleHostTick(budget({ networkMiB: 20 }), [item("net", "alpha", 0, "networkMiB", 80)]),
			).handled,
		).toBe(20);
		expect(
			balanceSettlements(
				[item("disk", "alpha", 0, "diskOps", 80)],
				settleHostTick(budget({ diskOps: 30 }), [item("disk", "alpha", 0, "diskOps", 80)]),
			).handled,
		).toBe(30);
	});

	it("does not change per-project handled amounts when items or hosts are reordered", () => {
		const hostA = budget({ cpuWork: 10 });
		const hostB = budget({ cpuWork: 100 });
		const alpha = item("a1", "alpha", 0, "cpuWork", 20);
		const beta = item("b1", "beta", 0, "cpuWork", 10);

		const first = handledByProject(settleHostTick(hostA, [alpha, beta]));
		const second = handledByProject(settleHostTick(hostA, [beta, alpha]));

		expect(first).toEqual(second);
		expect(handledByProject(settleHostTick(hostB, [alpha]))).toEqual(
			handledByProject(settleHostTick(hostB, [alpha])),
		);
		expect(first.alpha).toBe(7);
		expect(first.beta).toBe(3);
	});
});

function budget(overrides: Partial<HostBudget> = {}): HostBudget {
	return {
		cpuWork: 0,
		gpuWork: 0,
		gpuCount: 0,
		gpuMemoryMiB: 0,
		residentMemoryMiB: 0,
		queuedMemoryMiB: 0,
		diskCapacityMiB: 0,
		diskOps: 0,
		networkMiB: 0,
		...overrides,
	};
}

function item(
	id: string,
	projectId: string,
	arrivalTick: number,
	dimension: WorkItem["dimension"],
	amount: number,
	extra: Partial<WorkItem> = {},
): WorkItem {
	return {
		id,
		projectId,
		arrivalTick,
		dimension,
		amount,
		gpuWork: 0,
		gpuMemoryMiB: 0,
		waitPolicy: "interactive",
		...extra,
	};
}

function handledByProject(settlements: readonly { projectId: string; handled: number }[]): {
	alpha?: number;
	beta?: number;
} {
	const totals: { alpha?: number; beta?: number } = {};

	for (const row of settlements) {
		if (row.projectId === "alpha" || row.projectId === "beta") {
			totals[row.projectId] = (totals[row.projectId] ?? 0) + row.handled;
		}
	}

	return totals;
}

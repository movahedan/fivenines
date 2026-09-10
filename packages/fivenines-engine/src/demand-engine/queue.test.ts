import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { WorkQueue } from "./queue";

describe("WorkQueue - isolation", () => {
	it("is not imported by Game", () => {
		const source = readFileSync(join(import.meta.dir, "../game.ts"), "utf8");

		expect(source.includes("demand-engine")).toBe(false);
	});
});

describe("WorkQueue - cohorts", () => {
	it("keeps leftover and new arrivals as two groups with original ages", () => {
		const queue = new WorkQueue(10_000);
		queue.admit(0, [{ demandTypeId: "email-message", waitPolicy: "queued", count: 30 }]);
		queue.admit(1, [{ demandTypeId: "email-message", waitPolicy: "queued", count: 80 }]);

		const cohorts = queue.cohorts();

		expect(cohorts).toHaveLength(2);
		expect(cohorts[0]?.arrivalHour).toBe(0);
		expect(cohorts[0]?.remainingCount).toBe(30);
		expect(cohorts[1]?.arrivalHour).toBe(1);
		expect(cohorts[1]?.remainingCount).toBe(80);
	});

	it("rejects new work when occupancy would exceed capacity and keeps the old cohort", () => {
		const queue = new WorkQueue(64 * 10);
		queue.admit(0, [{ demandTypeId: "email-message", waitPolicy: "queued", count: 10 }]);
		const result = queue.admit(1, [
			{ demandTypeId: "email-message", waitPolicy: "queued", count: 10 },
		]);

		expect(result.rejectedCount).toBe(10);
		expect(queue.cohorts()).toHaveLength(1);
		expect(queue.cohorts()[0]?.arrivalHour).toBe(0);
	});

	it("expires queued work after two carry ticks and keeps job progress", () => {
		const queue = new WorkQueue(100_000);
		queue.admit(0, [{ demandTypeId: "email-message", waitPolicy: "queued", count: 4 }]);
		queue.admit(0, [{ demandTypeId: "transcode-job", waitPolicy: "job", count: 1 }]);
		queue.advance(0, "transcode-job", 0, 0);

		expect(queue.expire(3).some((cohort) => cohort.demandTypeId === "email-message")).toBe(true);
		expect(queue.cohorts().some((cohort) => cohort.demandTypeId === "transcode-job")).toBe(true);
	});

	it("expires interactive and continuous work when it would carry past the arrival tick", () => {
		const queue = new WorkQueue(100_000);
		queue.admit(5, [{ demandTypeId: "page-read", waitPolicy: "interactive", count: 8 }]);
		queue.admit(5, [{ demandTypeId: "video-minute", waitPolicy: "continuous", count: 3 }]);
		queue.admit(5, [{ demandTypeId: "inference-gpu", waitPolicy: "interactive", count: 1 }]);

		const expired = queue.expire(6);

		expect(expired.map((cohort) => cohort.demandTypeId).sort()).toEqual([
			"inference-gpu",
			"page-read",
			"video-minute",
		]);
	});

	it("exposes execution inputs without allocating resources", () => {
		const queue = new WorkQueue(100_000);
		queue.admit(0, [{ demandTypeId: "batch-job", waitPolicy: "job", count: 1 }]);

		const input = queue.toExecutionInput();

		expect(input.cohorts).toHaveLength(1);
		expect(input.durableMemoryMicroMiB).toBeGreaterThan(0);
		expect(input.queuedMemoryKiB).toBe(16);
	});
});

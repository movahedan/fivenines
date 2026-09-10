import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DEMAND_VARIATION } from "../catalog/demand-variation";
import { DemandEngine, type DemandEngineOptions } from "./engine";
import { splitLargestRemainder } from "./mix";
import { SeededRandomSource, seedFromProjectId } from "./rng";

function appointment(overrides: Partial<DemandEngineOptions> = {}): DemandEngine {
	return DemandEngine.hourly("appointment-site", {
		projectId: "proj-a",
		region: "utc+0",
		...overrides,
	});
}

describe("DemandEngine - isolation", () => {
	it("is not imported by Game", () => {
		const source = readFileSync(join(import.meta.dir, "../game.ts"), "utf8");

		expect(source.includes("demand-engine")).toBe(false);
	});
});

describe("DemandEngine - constant split", () => {
	it("emits floor office-afternoon appointment demand as page-read and record-write", () => {
		const hour = appointment({ constant: true }).generate(10);
		const page = hour.batches.find((batch) => batch.demandTypeId === "page-read");
		const write = hour.batches.find((batch) => batch.demandTypeId === "record-write");

		expect(hour.totalCount).toBe(Math.floor(hour.meanRate));
		expect((page?.count ?? 0) + (write?.count ?? 0)).toBe(hour.totalCount);
		expect(page?.waitPolicy).toBe("interactive");
		expect(write?.waitPolicy).toBe("interactive");
	});

	it("emits more appointment demand at local office hours than overnight", () => {
		const engine = appointment({ constant: true });

		expect(engine.generate(10).totalCount).toBeGreaterThan(engine.generate(3).totalCount);
	});

	it("shifts office rhythm with region offset", () => {
		const utc = appointment({ constant: true, projectId: "same" }).generate(10);
		const west = DemandEngine.hourly("appointment-site", {
			projectId: "same",
			region: "utc-8",
			constant: true,
		}).generate(10);

		expect(utc.totalCount).toBeGreaterThan(west.totalCount);
	});

	it("returns no hourly batches when inactive", () => {
		const engine = appointment({ constant: true, active: false });

		expect(engine.generate(10).totalCount).toBe(0);
	});

	it("splits a shop mix with largest remainder without dropping units", () => {
		const counts = splitLargestRemainder(1000, [
			{ demandTypeId: "page-read", permille: 900 },
			{ demandTypeId: "record-write", permille: 70 },
			{ demandTypeId: "payment", permille: 30 },
		]);

		expect(counts["page-read"] + counts["record-write"] + counts.payment).toBe(1000);
	});
});

describe("DemandEngine - families", () => {
	it("covers interactive queued continuous gpu and finite cpu work", () => {
		const interactive = appointment({ constant: true }).generate(10).batches[0];
		const queued = DemandEngine.hourly("mailbox-service", {
			projectId: "mail",
			region: "utc+0",
			constant: true,
		}).generate(10);
		const continuous = DemandEngine.hourly("video-library", {
			projectId: "video",
			region: "utc+0",
			constant: true,
		}).generate(20);
		const gpu = DemandEngine.hourly("inference-api", {
			projectId: "inf",
			region: "utc+0",
			constant: true,
		}).generate(0);
		const job = DemandEngine.finite("transcode-job", {
			projectId: "job",
			region: "utc+0",
		}).activateFinite(0);

		expect(interactive?.waitPolicy).toBe("interactive");
		expect(queued.batches.some((batch) => batch.waitPolicy === "queued")).toBe(true);
		expect(continuous.batches[0]?.waitPolicy).toBe("continuous");
		expect(gpu.batches[0]?.demandTypeId).toBe("inference-gpu");
		expect(job.batches[0]).toEqual({
			demandTypeId: "transcode-job",
			waitPolicy: "job",
			count: 1,
		});
	});

	it("does not emit hourly poisson for finite templates", () => {
		const engine = DemandEngine.finite("batch-job", { projectId: "batch", region: "utc+0" });

		expect(engine.generate(5).totalCount).toBe(0);
	});

	it("refuses expansion templates by default", () => {
		expect(() => DemandEngine.hourly("conferencing", { projectId: "x", region: "utc+0" })).toThrow(
			"expansion demand is disabled",
		);
	});
});

describe("DemandEngine - campaigns and spikes", () => {
	it("does not stack a random campaign onto an event rhythm", () => {
		const live = DemandEngine.hourly("live-events", {
			projectId: "live",
			region: "utc+0",
			constant: true,
			scheduledCampaign: { startHour: 10, durationHours: 4 },
		});
		const before = live.generate(9).meanRate;
		const inside = live.generate(10).meanRate;

		expect(inside).toBeGreaterThan(before);
		expect(inside).toBe(before * (DEMAND_VARIATION.volatile.campaignPermille / 1000));
	});
});

describe("DemandEngine - seeded streams", () => {
	it("replays the same batches for one project seed and hour sequence", () => {
		const first = DemandEngine.hourly("community-site", { projectId: "seeded", region: "utc+0" });
		const second = DemandEngine.hourly("community-site", { projectId: "seeded", region: "utc+0" });
		const hours = [0, 1, 2, 20, 50];

		expect(hours.map((hour) => first.generate(hour))).toEqual(
			hours.map((hour) => second.generate(hour)),
		);
	});

	it("does not change another project when a neighbor draws first", () => {
		const solo = DemandEngine.hourly("dns-hosting", { projectId: "dns-b", region: "utc+0" });
		const neighbor = DemandEngine.hourly("appointment-site", {
			projectId: "dns-a",
			region: "utc+0",
		});
		const paired = DemandEngine.hourly("dns-hosting", { projectId: "dns-b", region: "utc+0" });

		neighbor.generate(0);
		const fromPair = paired.generate(0);
		const fromSolo = solo.generate(0);

		expect(fromPair).toEqual(fromSolo);
	});

	it("hashes distinct project ids to different seeds", () => {
		expect(seedFromProjectId("a")).not.toBe(seedFromProjectId("b"));
		expect(new SeededRandomSource(1).nextUnit()).not.toBe(new SeededRandomSource(2).nextUnit());
	});
});

describe("DemandEngine - constant mean", () => {
	it("uses baseline times rhythm permille without jitter", () => {
		const hour = DemandEngine.hourly("dns-hosting", {
			projectId: "stat",
			region: "utc+0",
			constant: true,
		}).generate(0);

		expect(hour.meanRate).toBe(10_000);
		expect(hour.totalCount).toBe(10_000);
	});
});

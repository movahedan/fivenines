import { describe, expect, it } from "bun:test";

import { FINITE_DEMAND_TEMPLATES, HOURLY_DEMAND_TEMPLATES } from "./demand-projects";
import { DEMAND_RHYTHM_PERMILLE } from "./demand-rhythms";
import { DEMAND_COST_MICRO, DEMAND_TYPES, demandTypeById } from "./demand-types";
import { combineArrivalPermille } from "./demand-variation";

describe("DEMAND_TYPES - micro translation", () => {
	it("stores dns-query network as 500 micro-MiB", () => {
		expect(DEMAND_TYPES["dns-query"].networkMicroMiB).toBe(500);
		expect(DEMAND_COST_MICRO).toBe(1_000_000);
	});

	it("keeps application and database CPU separate for page-read", () => {
		expect(DEMAND_TYPES["page-read"].applicationCpuWorkMicro).toBe(600_000);
		expect(DEMAND_TYPES["page-read"].databaseCpuWorkMicro).toBe(400_000);
	});
});

describe("DEMAND_RHYTHM_PERMILLE - daily mean", () => {
	it("keeps flat bands at 1000 permille", () => {
		expect(DEMAND_RHYTHM_PERMILLE.flat).toEqual([1000, 1000, 1000, 1000]);
	});

	it("raises office afternoon above overnight", () => {
		expect(DEMAND_RHYTHM_PERMILLE.office[2]).toBeGreaterThan(DEMAND_RHYTHM_PERMILLE.office[0]);
	});
});

describe("combineArrivalPermille - cap", () => {
	it("clamps campaign times spike to 6000 permille", () => {
		expect(combineArrivalPermille(3000, 3000)).toBe(6000);
	});
});

describe("demand templates - v1 mixes", () => {
	it("sums hourly mix permille to 1000", () => {
		for (const template of Object.values(HOURLY_DEMAND_TEMPLATES)) {
			const total = template.mix.reduce((sum, share) => sum + share.permille, 0);
			expect(total).toBe(1000);
		}
	});

	it("resolves every mix key to a demand type", () => {
		for (const template of Object.values(HOURLY_DEMAND_TEMPLATES)) {
			for (const share of template.mix) {
				expect(demandTypeById(share.demandTypeId).id).toBe(share.demandTypeId);
			}
		}
	});

	it("marks transcode-job and batch-job as version-one finite work", () => {
		expect(FINITE_DEMAND_TEMPLATES["transcode-job"]?.release).toBe("v1");
		expect(FINITE_DEMAND_TEMPLATES["batch-job"]?.release).toBe("v1");
		expect(FINITE_DEMAND_TEMPLATES["training-job"]?.release).toBe("expansion");
	});
});

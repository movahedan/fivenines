import { describe, expect, it } from "bun:test";

import { CAPACITY_POLICY } from "./capacity-policy";

describe("CAPACITY_POLICY - v1 tables", () => {
	it("uses cpuPerRequest 1 for every category and inflightPerThousandRequests 10", () => {
		expect(CAPACITY_POLICY.inflightPerThousandRequests).toBe(10);
		expect(CAPACITY_POLICY.categories.shopping).toEqual({
			cpuPerRequest: 1,
			bytesPerRequest: 40,
			memPerInflight: 2,
		});
		expect(CAPACITY_POLICY.categories.saas).toEqual({
			cpuPerRequest: 1,
			bytesPerRequest: 10,
			memPerInflight: 4,
		});
		expect(CAPACITY_POLICY.categories.portfolio).toEqual({
			cpuPerRequest: 1,
			bytesPerRequest: 20,
			memPerInflight: 1,
		});
	});
});

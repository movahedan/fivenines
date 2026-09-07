import { describe, expect, it } from "bun:test";

import { SLA_WINDOW_HOURS, slaAvailabilityPpm } from "./sla-policy";

describe("SLA_POLICY - window and ppm", () => {
	it("uses a 168-hour window and returns null ppm when emitted is 0", () => {
		expect(SLA_WINDOW_HOURS).toBe(168);
		expect(slaAvailabilityPpm(0, 0)).toBeNull();
		expect(slaAvailabilityPpm(0, 700)).toBe(0);
		expect(slaAvailabilityPpm(700, 700)).toBe(1_000_000);
	});
});

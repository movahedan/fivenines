import { describe, expect, it } from "bun:test";

import { SLA_WINDOW_HOURS, slaAvailabilityPpm, slaRecoveryHours } from "./sla-policy";

describe("SLA_POLICY - window and ppm", () => {
	it("uses a 168-hour window and returns null ppm when emitted is 0", () => {
		expect(SLA_WINDOW_HOURS).toBe(168);
		expect(slaAvailabilityPpm(0, 0)).toBeNull();
		expect(slaAvailabilityPpm(0, 700)).toBe(0);
		expect(slaAvailabilityPpm(700, 700)).toBe(1_000_000);
	});
});

describe("SLA_POLICY - slaRecoveryHours", () => {
	it("returns null when the current window already meets the target", () => {
		const samples = Array.from({ length: 10 }, () => ({ handled: 1000, emitted: 1000 }));

		expect(slaRecoveryHours(samples, 990_000)).toBeNull();
	});

	it("returns a finite hour count after one bad hour then healthy hours", () => {
		const hours = slaRecoveryHours([{ handled: 0, emitted: 1000 }], 990_000);

		expect(hours).toBeGreaterThan(0);
		expect(hours).toBeLessThanOrEqual(SLA_WINDOW_HOURS);
	});

	it("returns null when the target is unreachable inside one window", () => {
		const samples = Array.from({ length: SLA_WINDOW_HOURS }, () => ({ handled: 0, emitted: 1000 }));

		expect(slaRecoveryHours(samples, 1_000_001)).toBeNull();
	});

	it("returns null when samples are empty", () => {
		expect(slaRecoveryHours([], 990_000)).toBeNull();
	});
});

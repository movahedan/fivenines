import { describe, expect, it } from "bun:test";

import type { OpeningShiftSnapshot } from "./opening-shift-policy";
import { OPENING_SHIFT_HOURS, openingShiftOutcome } from "./opening-shift-policy";

const HEALTHY = {
	status: "served" as const,
	windowAvailabilityPpm: 995_000,
	targetPpm: 990_000,
	settlements: [],
};

function snapshot(overrides: Partial<OpeningShiftSnapshot> = {}): OpeningShiftSnapshot {
	return {
		hourIndex: OPENING_SHIFT_HOURS,
		cashCents: 1,
		jailed: false,
		projects: [HEALTHY, { ...HEALTHY, windowAvailabilityPpm: 990_000 }],
		...overrides,
	};
}

describe("opening-shift-policy - outcome", () => {
	it("stays in progress before hour 336", () => {
		expect(openingShiftOutcome(snapshot({ hourIndex: OPENING_SHIFT_HOURS - 1 })).status).toBe(
			"in_progress",
		);
		expect(OPENING_SHIFT_HOURS).toBe(336);
	});

	it("wins when cash is positive, two contracts meet target, and no catastrophe credit", () => {
		expect(openingShiftOutcome(snapshot()).status).toBe("won");
	});

	it("loses when cash is not positive", () => {
		const outcome = openingShiftOutcome(snapshot({ cashCents: 0 }));

		expect(outcome.status).toBe("lost");
		expect(outcome.failed).toContain("cash");
	});

	it("loses when jailed even with otherwise winning books", () => {
		const outcome = openingShiftOutcome(snapshot({ jailed: true, cashCents: 5_000 }));

		expect(outcome.status).toBe("lost");
		expect(outcome.failed).toContain("jailed");
	});

	it("loses when fewer than two served projects meet the window target", () => {
		const outcome = openingShiftOutcome(
			snapshot({
				projects: [HEALTHY, { ...HEALTHY, windowAvailabilityPpm: 800_000 }],
			}),
		);

		expect(outcome.status).toBe("lost");
		expect(outcome.failed).toContain("contracts");
	});

	it("loses when any settlement credited the full period revenue", () => {
		const outcome = openingShiftOutcome(
			snapshot({
				projects: [
					HEALTHY,
					{
						...HEALTHY,
						settlements: [{ periodRevenueCents: 1_000, creditCents: 1_000 }],
					},
				],
			}),
		);

		expect(outcome.status).toBe("lost");
		expect(outcome.failed).toContain("catastrophe");
	});
});

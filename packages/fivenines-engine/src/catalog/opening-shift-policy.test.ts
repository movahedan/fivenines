import { describe, expect, it } from "bun:test";

import { BILLING_PERIOD_HOURS } from "./commercial-policy";
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
	it("stays in progress before the first billing week ends", () => {
		expect(openingShiftOutcome(snapshot({ hourIndex: OPENING_SHIFT_HOURS - 1 })).status).toBe(
			"in_progress",
		);
		expect(OPENING_SHIFT_HOURS).toBe(BILLING_PERIOD_HOURS);
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

	it("loses when any settlement landed in the catastrophe credit band", () => {
		const outcome = openingShiftOutcome(
			snapshot({
				projects: [HEALTHY, { ...HEALTHY, settlements: [{ periodPpm: 700_000 }] }],
			}),
		);

		expect(outcome.status).toBe("lost");
		expect(outcome.failed).toContain("catastrophe");
	});

	it("still loses when the catastrophic period was parked end to end", () => {
		// A week parked start to finish bills nothing, so a revenue-keyed check
		// would let the player dodge the loss on a contract they were failing.
		const outcome = openingShiftOutcome(
			snapshot({
				projects: [HEALTHY, { ...HEALTHY, settlements: [{ periodPpm: 0 }] }],
			}),
		);

		expect(outcome.status).toBe("lost");
		expect(outcome.failed).toContain("catastrophe");
	});

	it("ignores settlements that only earned a partial credit", () => {
		const outcome = openingShiftOutcome(
			snapshot({
				projects: [HEALTHY, { ...HEALTHY, settlements: [{ periodPpm: 985_000 }] }],
			}),
		);

		expect(outcome.status).toBe("won");
		expect(outcome.failed).toEqual([]);
	});

	it("ignores a period that never emitted demand", () => {
		const outcome = openingShiftOutcome(
			snapshot({
				projects: [HEALTHY, { ...HEALTHY, settlements: [{ periodPpm: null }] }],
			}),
		);

		expect(outcome.status).toBe("won");
	});
});

import { describe, expect, it } from "bun:test";

import {
	BILLING_PERIOD_HOURS,
	OPENING_COMMERCIAL_STUB,
	PAYG_ONLY_COMMERCIAL_STUB,
	parseCommercialTerms,
	SETTLEMENT_HISTORY_K,
} from "./commercial-policy";

describe("commercial-policy - v1 tables", () => {
	it("uses a 168-hour billing period, history cap 8, and the opening stub card", () => {
		expect(BILLING_PERIOD_HOURS).toBe(168);
		expect(SETTLEMENT_HISTORY_K).toBe(8);
		expect(OPENING_COMMERCIAL_STUB).toEqual({
			paygCentsPerHandled: 1,
			recurringCentsPerPeriod: 2_000,
			targetPpm: 990_000,
			creditPpm: 100_000,
		});
		expect(PAYG_ONLY_COMMERCIAL_STUB).toEqual({
			paygCentsPerHandled: 1,
			recurringCentsPerPeriod: 0,
			targetPpm: 990_000,
			creditPpm: 100_000,
		});
	});
});

describe("commercial-policy - parseCommercialTerms", () => {
	it("accepts the opening stub and PAYG-only overload stub", () => {
		expect(parseCommercialTerms(OPENING_COMMERCIAL_STUB)).toEqual(OPENING_COMMERCIAL_STUB);
		expect(parseCommercialTerms(PAYG_ONLY_COMMERCIAL_STUB)).toEqual(PAYG_ONLY_COMMERCIAL_STUB);
	});

	it("throws when PAYG and recurring are both 0", () => {
		expect(() =>
			parseCommercialTerms({
				paygCentsPerHandled: 0,
				recurringCentsPerPeriod: 0,
				targetPpm: 990_000,
				creditPpm: 100_000,
			}),
		).toThrow("at least one of paygCentsPerHandled or recurringCentsPerPeriod must be positive");
	});

	it("throws when PAYG or recurring is negative", () => {
		expect(() =>
			parseCommercialTerms({
				...OPENING_COMMERCIAL_STUB,
				paygCentsPerHandled: -1,
			}),
		).toThrow("paygCentsPerHandled must be a non-negative integer");
		expect(() =>
			parseCommercialTerms({
				...OPENING_COMMERCIAL_STUB,
				recurringCentsPerPeriod: -1,
			}),
		).toThrow("recurringCentsPerPeriod must be a non-negative integer");
	});

	it("throws when targetPpm or creditPpm is not a finite integer", () => {
		expect(() =>
			parseCommercialTerms({
				...OPENING_COMMERCIAL_STUB,
				targetPpm: 1.5,
			}),
		).toThrow("targetPpm must be a finite integer");
		expect(() =>
			parseCommercialTerms({
				...OPENING_COMMERCIAL_STUB,
				creditPpm: Number.POSITIVE_INFINITY,
			}),
		).toThrow("creditPpm must be a finite integer");
	});
});

import { describe, expect, it } from "bun:test";

import {
	BILLING_PERIOD_HOURS,
	commercialTermsForCategory,
	OPENING_COMMERCIAL_STUB,
	OPENING_SLA_CREDIT_PPM,
	OPENING_SLA_TARGET_PPM,
	PAYG_CENTS_PER_THOUSAND_BY_CATEGORY,
	PAYG_ONLY_COMMERCIAL_STUB,
	parseCommercialTerms,
	paygCentsForHandled,
	SETTLEMENT_HISTORY_K,
} from "./commercial-policy";

describe("commercial-policy - v1 tables", () => {
	it("uses a 168-hour billing period, history cap 8, and per-thousand PAYG", () => {
		expect(BILLING_PERIOD_HOURS).toBe(168);
		expect(SETTLEMENT_HISTORY_K).toBe(8);
		expect(PAYG_CENTS_PER_THOUSAND_BY_CATEGORY).toEqual({
			portfolio: 450,
			saas: 450,
			shopping: 800,
		});
		expect(OPENING_COMMERCIAL_STUB).toEqual(commercialTermsForCategory("saas"));
		expect(PAYG_ONLY_COMMERCIAL_STUB).toEqual({
			paygCentsPerThousandHandled: 1_000,
			recurringCentsPerPeriod: 0,
			targetPpm: OPENING_SLA_TARGET_PPM,
			creditPpm: OPENING_SLA_CREDIT_PPM,
		});
		expect(OPENING_SLA_CREDIT_PPM).toBe(1_000_000);
	});

	it("floors PAYG as cents per thousand handled", () => {
		expect(paygCentsForHandled(1000, 450)).toBe(450);
		expect(paygCentsForHandled(1, 450)).toBe(0);
		expect(paygCentsForHandled(3, 450)).toBe(1);
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
				paygCentsPerThousandHandled: 0,
				recurringCentsPerPeriod: 0,
				targetPpm: 990_000,
				creditPpm: 100_000,
			}),
		).toThrow(
			"at least one of paygCentsPerThousandHandled or recurringCentsPerPeriod must be positive",
		);
	});

	it("throws when PAYG or recurring is negative", () => {
		expect(() =>
			parseCommercialTerms({
				...OPENING_COMMERCIAL_STUB,
				paygCentsPerThousandHandled: -1,
			}),
		).toThrow("paygCentsPerThousandHandled must be a non-negative integer");
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

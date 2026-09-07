import { units } from "@packages/shared/units";

export const BILLING_PERIOD_HOURS = 168;
export const SETTLEMENT_HISTORY_K = 8;

export type CommercialCategory = "shopping" | "saas" | "portfolio";

export interface CommercialTerms {
	paygCentsPerThousandHandled: number;
	recurringCentsPerPeriod: number;
	targetPpm: number;
	creditPpm: number;
}

export const PAYG_CENTS_PER_THOUSAND_BY_CATEGORY: Record<CommercialCategory, number> = {
	portfolio: 450,
	saas: 450,
	shopping: 800,
};

export const RECURRING_CENTS_PER_PERIOD_BY_CATEGORY: Record<CommercialCategory, number> = {
	portfolio: 800,
	saas: 1_500,
	shopping: 2_500,
};

export const OPENING_SLA_TARGET_PPM = 990_000;
export const OPENING_SLA_CREDIT_PPM = 1_000_000;

export function commercialTermsForCategory(category: CommercialCategory): CommercialTerms {
	return {
		paygCentsPerThousandHandled: PAYG_CENTS_PER_THOUSAND_BY_CATEGORY[category],
		recurringCentsPerPeriod: RECURRING_CENTS_PER_PERIOD_BY_CATEGORY[category],
		targetPpm: OPENING_SLA_TARGET_PPM,
		creditPpm: OPENING_SLA_CREDIT_PPM,
	};
}

export const OPENING_COMMERCIAL_STUB: CommercialTerms = commercialTermsForCategory("saas");

export const PAYG_ONLY_COMMERCIAL_STUB: CommercialTerms = {
	paygCentsPerThousandHandled: 1_000,
	recurringCentsPerPeriod: 0,
	targetPpm: OPENING_SLA_TARGET_PPM,
	creditPpm: OPENING_SLA_CREDIT_PPM,
};

export function paygCentsForHandled(
	handledRequests: number,
	paygCentsPerThousandHandled: number,
): number {
	return Math.floor((handledRequests * paygCentsPerThousandHandled) / 1_000);
}

export function parseCommercialTerms(input: CommercialTerms): CommercialTerms {
	const paygCentsPerThousandHandled = units.asNonNegativeInteger(
		input.paygCentsPerThousandHandled,
		"paygCentsPerThousandHandled",
	);
	const recurringCentsPerPeriod = units.asNonNegativeInteger(
		input.recurringCentsPerPeriod,
		"recurringCentsPerPeriod",
	);
	const targetPpm = units.asFiniteInteger(input.targetPpm, "targetPpm");
	const creditPpm = units.asFiniteInteger(input.creditPpm, "creditPpm");

	if (paygCentsPerThousandHandled === 0 && recurringCentsPerPeriod === 0) {
		throw new Error(
			"at least one of paygCentsPerThousandHandled or recurringCentsPerPeriod must be positive",
		);
	}

	return {
		paygCentsPerThousandHandled,
		recurringCentsPerPeriod,
		targetPpm,
		creditPpm,
	};
}

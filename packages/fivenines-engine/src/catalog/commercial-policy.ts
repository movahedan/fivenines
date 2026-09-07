import { units } from "@packages/shared/units";

export const BILLING_PERIOD_HOURS = 168;
export const PAYG_SETTLE_HOURS = 24;
export const SETTLEMENT_HISTORY_K = 8;

export const SLA_CREDIT_MILD_MIN_PPM = 950_000;
export const SLA_CREDIT_SEVERE_MIN_PPM = 800_000;
export const SLA_CREDIT_MILD_PPM = 250_000;
export const SLA_CREDIT_SEVERE_PPM = 500_000;
export const SLA_CREDIT_CATASTROPHE_PPM = 1_000_000;

export type CommercialCategory = "shopping" | "saas" | "portfolio";

export interface CommercialTerms {
	paygCentsPerThousandHandled: number;
	recurringCentsPerPeriod: number;
	targetPpm: number;
	creditPpm: number;
}

export const PAYG_CENTS_PER_THOUSAND_BY_CATEGORY: Record<CommercialCategory, number> = {
	portfolio: 330,
	saas: 450,
	shopping: 650,
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

export function slaCreditPpm(periodPpm: number | null, targetPpm: number): number {
	if (periodPpm === null || periodPpm >= targetPpm) {
		return 0;
	}

	if (periodPpm >= SLA_CREDIT_MILD_MIN_PPM) {
		return SLA_CREDIT_MILD_PPM;
	}

	if (periodPpm >= SLA_CREDIT_SEVERE_MIN_PPM) {
		return SLA_CREDIT_SEVERE_PPM;
	}

	return SLA_CREDIT_CATASTROPHE_PPM;
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

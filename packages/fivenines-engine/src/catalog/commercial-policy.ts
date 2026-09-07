import { units } from "@packages/shared/units";

export const BILLING_PERIOD_HOURS = 168;
export const SETTLEMENT_HISTORY_K = 8;

export interface CommercialTerms {
	paygCentsPerHandled: number;
	recurringCentsPerPeriod: number;
	targetPpm: number;
	creditPpm: number;
}

export const OPENING_COMMERCIAL_STUB: CommercialTerms = {
	paygCentsPerHandled: 1,
	recurringCentsPerPeriod: 2_000,
	targetPpm: 990_000,
	creditPpm: 100_000,
};

export const PAYG_ONLY_COMMERCIAL_STUB: CommercialTerms = {
	paygCentsPerHandled: 1,
	recurringCentsPerPeriod: 0,
	targetPpm: OPENING_COMMERCIAL_STUB.targetPpm,
	creditPpm: OPENING_COMMERCIAL_STUB.creditPpm,
};

export function parseCommercialTerms(input: CommercialTerms): CommercialTerms {
	const paygCentsPerHandled = units.asNonNegativeInteger(
		input.paygCentsPerHandled,
		"paygCentsPerHandled",
	);
	const recurringCentsPerPeriod = units.asNonNegativeInteger(
		input.recurringCentsPerPeriod,
		"recurringCentsPerPeriod",
	);
	const targetPpm = units.asFiniteInteger(input.targetPpm, "targetPpm");
	const creditPpm = units.asFiniteInteger(input.creditPpm, "creditPpm");

	if (paygCentsPerHandled === 0 && recurringCentsPerPeriod === 0) {
		throw new Error(
			"at least one of paygCentsPerHandled or recurringCentsPerPeriod must be positive",
		);
	}

	return {
		paygCentsPerHandled,
		recurringCentsPerPeriod,
		targetPpm,
		creditPpm,
	};
}

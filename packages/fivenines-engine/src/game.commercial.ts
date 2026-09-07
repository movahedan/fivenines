import { BILLING_PERIOD_HOURS, PAYG_SETTLE_HOURS } from "./catalog/commercial-policy";
import type { Project } from "./project";

export function accrueServedPayg(projects: readonly Project[]): number {
	let paygCents = 0;

	for (const project of projects) {
		paygCents += project.accrueServedPayg();
	}

	return paygCents;
}

export function settlePaygReceivableIfDue(hourIndex: number, receivableCents: number): number {
	if (hourIndex % PAYG_SETTLE_HOURS !== 0) {
		return 0;
	}

	return receivableCents;
}

export function closeBillingPeriodIfDue(projects: readonly Project[], hourIndex: number): number {
	if (hourIndex % BILLING_PERIOD_HOURS !== 0) {
		return 0;
	}

	const periodIndex = hourIndex / BILLING_PERIOD_HOURS;
	let netCents = 0;

	for (const project of projects) {
		netCents += project.closeBillingPeriod(periodIndex);
	}

	return netCents;
}

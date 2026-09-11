export const DESIGN_UNIT_CENTS = 100;
export const OFFER_TTL_HOURS = 48;
export const FIRST_SETUP_ALLOWANCE_HOURS = 24;
export const SETUP_PATIENCE_MIN_MILLIHOURS = 4_500;
export const SETUP_WITHDRAWAL_REPUTATION_DELTA = -3;
export const DEFAULT_CUSTOMER_TRUST = 40;
export const ACQUAINTANCE_TRUST = 70;
export const DEFAULT_HATRED = 0;
export const OFFER_INTERVAL_HOURS_AT_REPUTATION_ZERO = 24;
export const PENDING_OFFER_CAP_AT_REPUTATION_ZERO = 1;

export function designUnitsToCents(designUnits: number): number {
	return designUnits * DESIGN_UNIT_CENTS;
}

export function slaPercentToPpm(percent: number): number {
	return percent * 10_000;
}

export function setupPatienceMilliHours(trust: number, reputation: number, hatred: number): number {
	const milliHours = 6_000 + 120 * trust + 60 * reputation - 15 * hatred;

	return Math.max(SETUP_PATIENCE_MIN_MILLIHOURS, milliHours);
}

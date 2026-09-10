export const LEARNING_POLICY = {
	sharedConcurrentSlots: 2,
	monthHours: 672,
	designDollarsToCents: 100,
	baseTechnologyIds: ["application-runtime", "relational-database"] as const,
} as const;

export function tuitionCents(designDollars: number): number {
	return designDollars * LEARNING_POLICY.designDollarsToCents;
}

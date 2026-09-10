export type DemandVariationId = "early" | "standard" | "volatile";

export interface DemandVariation {
	readonly gammaShape: number;
	readonly spikeProbabilityPerMillion: number;
	readonly spikePermille: number;
	readonly spikeHours: number;
	readonly cooldownHours: number;
	readonly campaignPermille: number;
	readonly campaignHours: number;
	readonly campaignNoticeHours: number;
}

export const DEMAND_VARIATION: Record<DemandVariationId, DemandVariation> = {
	early: {
		gammaShape: 100,
		spikeProbabilityPerMillion: 2_000,
		spikePermille: 1250,
		spikeHours: 1,
		cooldownHours: 24,
		campaignPermille: 1500,
		campaignHours: 3,
		campaignNoticeHours: 24,
	},
	standard: {
		gammaShape: 25,
		spikeProbabilityPerMillion: 8_000,
		spikePermille: 2000,
		spikeHours: 2,
		cooldownHours: 12,
		campaignPermille: 2000,
		campaignHours: 6,
		campaignNoticeHours: 24,
	},
	volatile: {
		gammaShape: 9,
		spikeProbabilityPerMillion: 15_000,
		spikePermille: 3000,
		spikeHours: 3,
		cooldownHours: 8,
		campaignPermille: 3000,
		campaignHours: 8,
		campaignNoticeHours: 48,
	},
};

export const DEMAND_ARRIVAL_POLICY = {
	campaignMinimumGapHours: 168,
	campaignProbabilityPerThousand: 150,
	eventMultiplierCapPermille: 6000,
	idlePermille: 1000,
	million: 1_000_000,
} as const;

export function combineArrivalPermille(campaignPermille: number, spikePermille: number): number {
	return Math.min(
		Math.floor((campaignPermille * spikePermille) / DEMAND_ARRIVAL_POLICY.idlePermille),
		DEMAND_ARRIVAL_POLICY.eventMultiplierCapPermille,
	);
}

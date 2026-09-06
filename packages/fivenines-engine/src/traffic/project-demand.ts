import { type RegionId, regions } from "../catalog/regions";
import { TRAFFIC_POLICY } from "../catalog/traffic-policy";
import { type CategoryRhythm, rhythmFor } from "./category-rhythm";
import { localHour } from "./local-hour";
import type { RandomSource } from "./random-source";

const PERMILLE = 1000;

export interface DemandModel {
	demandFor(hourIndex: number, random: RandomSource): number;
}

export class ConstantDemand implements DemandModel {
	constructor(private readonly baseline: number) {}

	demandFor(_hourIndex: number, _random: RandomSource): number {
		return this.baseline;
	}
}

export interface ProjectDemandTraits {
	baseline: number;
	category: "shopping" | "saas" | "portfolio";
	region: RegionId;
	campaignProne: boolean;
	campaign?: { startHour: number; durationHours: number };
}

export class ProjectDemand implements DemandModel {
	#remainingHours = 0;
	#spikePermille: number = TRAFFIC_POLICY.idlePermille;

	readonly #traits: ProjectDemandTraits;
	readonly #rhythm: CategoryRhythm;

	constructor(traits: ProjectDemandTraits) {
		this.#traits = traits;
		this.#rhythm = rhythmFor(traits.category);
	}

	demandFor(hourIndex: number, random: RandomSource): number {
		const rhythmPermille = this.#rhythm.permilleForLocalHour(
			localHour(hourIndex, regions.offsetHoursFor(this.#traits.region)),
		);
		const campaignPermille = this.#campaignPermille(hourIndex);
		const spikePermille = this.#spikePermilleForHour(random);
		const jitterPermille =
			TRAFFIC_POLICY.jitter.minPermille +
			Math.floor(random.nextUnit() * TRAFFIC_POLICY.jitter.span);

		return Math.floor(
			(this.#traits.baseline * rhythmPermille * campaignPermille * spikePermille * jitterPermille) /
				PERMILLE /
				PERMILLE /
				PERMILLE /
				PERMILLE,
		);
	}

	#campaignPermille(hourIndex: number): number {
		const campaign = this.#traits.campaign;

		if (campaign === undefined) {
			return TRAFFIC_POLICY.idlePermille;
		}

		const inWindow =
			hourIndex >= campaign.startHour && hourIndex < campaign.startHour + campaign.durationHours;

		if (!inWindow) {
			return TRAFFIC_POLICY.idlePermille;
		}

		return TRAFFIC_POLICY.campaignWindowPermille;
	}

	#spikePermilleForHour(random: RandomSource): number {
		if (this.#remainingHours > 0) {
			this.#remainingHours -= 1;

			return this.#spikePermille;
		}

		const fatThreshold = this.#traits.campaignProne
			? TRAFFIC_POLICY.fatSpike.triggerPerThousandProne
			: TRAFFIC_POLICY.fatSpike.triggerPerThousand;

		if (Math.floor(random.nextUnit() * PERMILLE) < fatThreshold) {
			this.#remainingHours = TRAFFIC_POLICY.fatSpike.durationHours - 1;
			this.#spikePermille = TRAFFIC_POLICY.fatSpike.permille;

			return TRAFFIC_POLICY.fatSpike.permille;
		}

		if (Math.floor(random.nextUnit() * PERMILLE) < TRAFFIC_POLICY.weakSpike.triggerPerThousand) {
			this.#remainingHours = TRAFFIC_POLICY.weakSpike.durationHours - 1;
			this.#spikePermille = TRAFFIC_POLICY.weakSpike.permille;

			return TRAFFIC_POLICY.weakSpike.permille;
		}

		return TRAFFIC_POLICY.idlePermille;
	}
}

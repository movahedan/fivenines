import {
	type DemandTemplate,
	finiteTemplateById,
	type HourlyDemandTemplate,
	hourlyTemplateById,
} from "../catalog/demand-projects";
import { rhythmPermilleForLocalHour } from "../catalog/demand-rhythms";
import { type DemandTypeId, demandTypeById } from "../catalog/demand-types";
import {
	combineArrivalPermille,
	DEMAND_ARRIVAL_POLICY,
	DEMAND_VARIATION,
} from "../catalog/demand-variation";
import { type RegionId, regions } from "../catalog/regions";
import { localHour } from "../traffic/local-hour";
import type { RandomSource } from "../traffic/random-source";
import { splitLargestRemainder, splitMultinomial } from "./mix";
import { SeededRandomSource, seedFromProjectId } from "./rng";
import { sampleGammaPoisson } from "./sample";

export interface DemandBatch {
	readonly demandTypeId: DemandTypeId;
	readonly waitPolicy: ReturnType<typeof demandTypeById>["waitPolicy"];
	readonly count: number;
}

export interface DemandHour {
	readonly hourIndex: number;
	readonly meanRate: number;
	readonly totalCount: number;
	readonly batches: readonly DemandBatch[];
}

export interface DemandEngineOptions {
	readonly projectId: string;
	readonly region: RegionId;
	readonly active?: boolean;
	readonly constant?: boolean;
	readonly allowExpansion?: boolean;
	readonly random?: RandomSource;
	readonly scheduledCampaign?: { readonly startHour: number; readonly durationHours: number };
}

function emptyHour(hourIndex: number): DemandHour {
	return { hourIndex, meanRate: 0, totalCount: 0, batches: [] };
}

function batchesFromCounts(counts: Readonly<Record<DemandTypeId, number>>): DemandBatch[] {
	const batches: DemandBatch[] = [];

	for (const [demandTypeId, count] of Object.entries(counts) as [DemandTypeId, number][]) {
		if (count === 0) {
			continue;
		}

		const demandType = demandTypeById(demandTypeId);
		batches.push({ demandTypeId, waitPolicy: demandType.waitPolicy, count });
	}

	return batches;
}

function assertReleaseAllowed(template: DemandTemplate, allowExpansion: boolean): void {
	if (template.release === "expansion" && !allowExpansion) {
		throw new Error(`expansion demand is disabled: ${template.id}`);
	}

	if (template.kind === "hourly") {
		for (const share of template.mix) {
			const demandType = demandTypeById(share.demandTypeId);

			if (demandType.release === "expansion" && !allowExpansion) {
				throw new Error(`expansion demand type is disabled: ${share.demandTypeId}`);
			}
		}

		return;
	}

	const demandType = demandTypeById(template.demandTypeId);

	if (demandType.release === "expansion" && !allowExpansion) {
		throw new Error(`expansion demand type is disabled: ${template.demandTypeId}`);
	}
}

function inCampaignWindow(
	window: { startHour: number; durationHours: number } | undefined,
	hourIndex: number,
): boolean {
	if (window === undefined) {
		return false;
	}

	return hourIndex >= window.startHour && hourIndex < window.startHour + window.durationHours;
}

export class DemandEngine {
	readonly #template: DemandTemplate;
	readonly #projectId: string;
	readonly #region: RegionId;
	readonly #constant: boolean;
	readonly #allowExpansion: boolean;
	readonly #random: RandomSource;
	readonly #scheduledCampaign?: { readonly startHour: number; readonly durationHours: number };

	#active: boolean;
	#spikeHoursRemaining = 0;
	#spikePermille: number = DEMAND_ARRIVAL_POLICY.idlePermille;
	#cooldownHoursRemaining = 0;
	#rolledCampaign: { startHour: number; durationHours: number } | undefined;
	#lastCampaignEndHour: number | undefined;

	constructor(template: DemandTemplate, options: DemandEngineOptions) {
		assertReleaseAllowed(template, options.allowExpansion === true);
		this.#template = template;
		this.#projectId = options.projectId;
		this.#region = options.region;
		this.#active = options.active !== false;
		this.#constant = options.constant === true;
		this.#allowExpansion = options.allowExpansion === true;
		this.#random = options.random ?? new SeededRandomSource(seedFromProjectId(options.projectId));
		this.#scheduledCampaign = options.scheduledCampaign;
	}

	static hourly(templateId: string, options: DemandEngineOptions): DemandEngine {
		return new DemandEngine(hourlyTemplateById(templateId), options);
	}

	static finite(templateId: string, options: DemandEngineOptions): DemandEngine {
		return new DemandEngine(finiteTemplateById(templateId), options);
	}

	get projectId(): string {
		return this.#projectId;
	}

	setActive(active: boolean): void {
		this.#active = active;
	}

	activateFinite(hourIndex: number): DemandHour {
		if (this.#template.kind !== "finite") {
			throw new Error(`not a finite demand template: ${this.#template.id}`);
		}

		assertReleaseAllowed(this.#template, this.#allowExpansion);

		if (!this.#active) {
			return emptyHour(hourIndex);
		}

		const demandType = demandTypeById(this.#template.demandTypeId);

		return {
			hourIndex,
			meanRate: 1,
			totalCount: 1,
			batches: [
				{
					demandTypeId: this.#template.demandTypeId,
					waitPolicy: demandType.waitPolicy,
					count: 1,
				},
			],
		};
	}

	generate(hourIndex: number): DemandHour {
		if (this.#template.kind === "finite") {
			return emptyHour(hourIndex);
		}

		if (!this.#active) {
			return emptyHour(hourIndex);
		}

		const template = this.#template;
		this.#maybeScheduleCampaign(hourIndex, template);
		const campaignPermille = this.#campaignPermille(hourIndex);
		const spikePermille = this.#nextSpikePermille(template);
		const combinedPermille = combineArrivalPermille(campaignPermille, spikePermille);
		const hour = localHour(hourIndex, regions.offsetHoursFor(this.#region));
		const rhythmPermille = rhythmPermilleForLocalHour(template.rhythm, hour);
		const meanRate =
			(template.baselineUnitsPerHour * rhythmPermille * combinedPermille) /
			(DEMAND_ARRIVAL_POLICY.idlePermille * DEMAND_ARRIVAL_POLICY.idlePermille);

		const totalCount = this.#constant
			? Math.floor(meanRate)
			: sampleGammaPoisson(meanRate, DEMAND_VARIATION[template.variation].gammaShape, this.#random);

		const counts = this.#constant
			? splitLargestRemainder(totalCount, template.mix)
			: splitMultinomial(totalCount, template.mix, this.#random);

		return {
			hourIndex,
			meanRate,
			totalCount,
			batches: batchesFromCounts(counts),
		};
	}

	#campaignPermille(hourIndex: number): number {
		const variation =
			this.#template.kind === "hourly" ? DEMAND_VARIATION[this.#template.variation] : undefined;
		const idle = DEMAND_ARRIVAL_POLICY.idlePermille;

		if (inCampaignWindow(this.#rolledCampaign, hourIndex)) {
			return variation?.campaignPermille ?? idle;
		}

		if (inCampaignWindow(this.#scheduledCampaign, hourIndex)) {
			return variation?.campaignPermille ?? idle;
		}

		return idle;
	}

	#maybeScheduleCampaign(hourIndex: number, template: HourlyDemandTemplate): void {
		if (template.rhythm === "event") {
			return;
		}

		if (hourIndex % 24 !== 0) {
			return;
		}

		if (this.#rolledCampaign !== undefined && hourIndex >= this.#rolledCampaign.startHour) {
			const endHour = this.#rolledCampaign.startHour + this.#rolledCampaign.durationHours;

			if (hourIndex >= endHour) {
				this.#lastCampaignEndHour = endHour;
				this.#rolledCampaign = undefined;
			}
		}

		if (this.#rolledCampaign !== undefined || this.#scheduledCampaign !== undefined) {
			return;
		}

		if (
			this.#lastCampaignEndHour !== undefined &&
			hourIndex - this.#lastCampaignEndHour < DEMAND_ARRIVAL_POLICY.campaignMinimumGapHours
		) {
			return;
		}

		if (this.#constant) {
			return;
		}

		if (
			Math.floor(this.#random.nextUnit() * 1000) >=
			DEMAND_ARRIVAL_POLICY.campaignProbabilityPerThousand
		) {
			return;
		}

		const variation = DEMAND_VARIATION[template.variation];
		this.#rolledCampaign = {
			startHour: hourIndex + variation.campaignNoticeHours,
			durationHours: variation.campaignHours,
		};
	}

	#nextSpikePermille(template: HourlyDemandTemplate): number {
		if (this.#spikeHoursRemaining > 0) {
			this.#spikeHoursRemaining -= 1;

			if (this.#spikeHoursRemaining === 0) {
				this.#cooldownHoursRemaining = DEMAND_VARIATION[template.variation].cooldownHours;
			}

			return this.#spikePermille;
		}

		if (this.#cooldownHoursRemaining > 0) {
			this.#cooldownHoursRemaining -= 1;

			return DEMAND_ARRIVAL_POLICY.idlePermille;
		}

		if (this.#constant) {
			return DEMAND_ARRIVAL_POLICY.idlePermille;
		}

		const variation = DEMAND_VARIATION[template.variation];

		if (
			Math.floor(this.#random.nextUnit() * DEMAND_ARRIVAL_POLICY.million) <
			variation.spikeProbabilityPerMillion
		) {
			this.#spikeHoursRemaining = variation.spikeHours - 1;
			this.#spikePermille = variation.spikePermille;

			if (this.#spikeHoursRemaining === 0) {
				this.#cooldownHoursRemaining = variation.cooldownHours;
			}

			return variation.spikePermille;
		}

		return DEMAND_ARRIVAL_POLICY.idlePermille;
	}
}

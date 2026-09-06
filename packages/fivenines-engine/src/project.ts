import { units } from "@packages/shared/units";

import { type RegionId, regions } from "./catalog/regions";
import { TRAFFIC_POLICY } from "./catalog/traffic-policy";
import {
	EMPTY_PROJECT_TICK_METRICS,
	measureProjectTick,
	type ProjectTickMetrics,
} from "./project.metrics";
import { ConstantDemand, type DemandModel, ProjectDemand } from "./traffic/project-demand";
import type { RandomSource } from "./traffic/random-source";

export type { ProjectTickMetrics } from "./project.metrics";

export type ProjectStatus = "offered" | "declined" | "served";
export type ProjectCategory = "shopping" | "saas" | "portfolio";
export type DemandKind = "constant" | "shaped";

export interface CampaignWindow {
	startHour: number;
	durationHours: number;
}

export interface ProjectInitial {
	id: string;
	estimatedRequestsPerHour: number;
	status: ProjectStatus;
	demand: DemandKind;
	category: ProjectCategory;
	region: RegionId;
	campaignProne: boolean;
	campaign?: CampaignWindow;
}

function isProjectCategory(value: string): value is ProjectCategory {
	return Object.hasOwn(TRAFFIC_POLICY.rhythm, value);
}

function parseCampaign(campaign: CampaignWindow): CampaignWindow {
	const startHour = units.asNonNegativeInteger(campaign.startHour, "startHour");
	const durationHours = units.asFiniteInteger(campaign.durationHours, "durationHours");

	if (durationHours < 1) {
		throw new Error("durationHours must be a positive integer");
	}

	return { startHour, durationHours };
}

export class Project {
	readonly id: string;
	readonly estimatedRequestsPerHour: number;
	readonly demand: DemandKind;
	readonly category: ProjectCategory;
	readonly region: RegionId;
	readonly campaignProne: boolean;
	readonly campaign: CampaignWindow | undefined;
	readonly #status: ProjectStatus;
	readonly #demandModel: DemandModel;
	#metrics: ProjectTickMetrics = EMPTY_PROJECT_TICK_METRICS;

	constructor(initial: ProjectInitial) {
		this.id = initial.id;
		this.estimatedRequestsPerHour = units.asNonNegativeInteger(
			initial.estimatedRequestsPerHour,
			"estimatedRequestsPerHour",
		);
		this.#status = initial.status;
		this.demand = initial.demand;

		if (!isProjectCategory(initial.category)) {
			throw new Error(`unknown project category: ${initial.category}`);
		}

		this.category = initial.category;
		this.region = regions.parseRegionId(initial.region);
		this.campaignProne = initial.campaignProne;
		this.campaign = initial.campaign === undefined ? undefined : parseCampaign(initial.campaign);
		this.#demandModel =
			initial.demand === "constant"
				? new ConstantDemand(this.estimatedRequestsPerHour)
				: new ProjectDemand({
						baseline: this.estimatedRequestsPerHour,
						category: this.category,
						region: this.region,
						campaignProne: this.campaignProne,
						campaign: this.campaign,
					});
	}

	get status(): ProjectStatus {
		return this.#status;
	}

	get metrics(): ProjectTickMetrics {
		return this.#metrics;
	}

	tick(hourIndex: number, random: RandomSource): number {
		if (this.#status !== "served") {
			this.#metrics = EMPTY_PROJECT_TICK_METRICS;

			return 0;
		}

		const emittedRequests = this.#demandModel.demandFor(hourIndex, random);

		this.#metrics = measureProjectTick(emittedRequests);

		return emittedRequests;
	}
}

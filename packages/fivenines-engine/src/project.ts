import { units } from "@packages/shared/units";

import { TRAFFIC_POLICY } from "./catalog/traffic-policy";
import { ConstantDemand, type DemandModel, ProjectDemand } from "./traffic/project-demand";
import type { RandomSource } from "./traffic/random-source";

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
	timezoneHours: number;
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
	readonly timezoneHours: number;
	readonly campaignProne: boolean;
	readonly campaign: CampaignWindow | undefined;
	readonly #status: ProjectStatus;
	readonly #demandModel: DemandModel;

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

		const timezoneHours = units.asFiniteInteger(initial.timezoneHours, "timezoneHours");

		if (
			timezoneHours < TRAFFIC_POLICY.timezoneHours.min ||
			timezoneHours > TRAFFIC_POLICY.timezoneHours.max
		) {
			throw new Error(
				`timezoneHours must be between ${String(TRAFFIC_POLICY.timezoneHours.min)} and ${String(TRAFFIC_POLICY.timezoneHours.max)}`,
			);
		}

		this.timezoneHours = timezoneHours;
		this.campaignProne = initial.campaignProne;
		this.campaign = initial.campaign === undefined ? undefined : parseCampaign(initial.campaign);
		this.#demandModel =
			initial.demand === "constant"
				? new ConstantDemand(this.estimatedRequestsPerHour)
				: new ProjectDemand({
						baseline: this.estimatedRequestsPerHour,
						category: this.category,
						timezoneHours: this.timezoneHours,
						campaignProne: this.campaignProne,
						campaign: this.campaign,
					});
	}

	get status(): ProjectStatus {
		return this.#status;
	}

	tick(hourIndex: number, random: RandomSource): number {
		if (this.#status !== "served") {
			return 0;
		}

		return this.#demandModel.demandFor(hourIndex, random);
	}
}

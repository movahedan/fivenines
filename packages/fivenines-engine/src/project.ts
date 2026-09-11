import { units } from "@packages/shared/units";

import {
	BILLING_PERIOD_HOURS,
	type CommercialTerms,
	parseCommercialTerms,
	paygCentsForHandled,
	SETTLEMENT_HISTORY_K,
	slaCreditPpm,
} from "./catalog/commercial-policy";
import { FIRST_SETUP_ALLOWANCE_HOURS, setupPatienceMilliHours } from "./catalog/contract-policy";
import { type RegionId, regions } from "./catalog/regions";
import { SLA_WINDOW_HOURS, slaAvailabilityPpm } from "./catalog/sla-policy";
import { TRAFFIC_POLICY } from "./catalog/traffic-policy";
import {
	EMPTY_PROJECT_TICK_METRICS,
	measureProjectTick,
	type ProjectSlaHour,
	type ProjectTickMetrics,
	type SlaHourSample,
	windowAvailabilityPpm,
} from "./project.metrics";
import { ConstantDemand, type DemandModel, ProjectDemand } from "./traffic/project-demand";
import type { RandomSource } from "./traffic/random-source";

export type { ProjectTickMetrics } from "./project.metrics";

export type ProjectStatus =
	| "offered"
	| "declined"
	| "expired"
	| "accepted"
	| "served"
	| "offline"
	| "withdrawn";
export type ProjectCategory = "shopping" | "saas" | "portfolio";
export type DemandKind = "constant" | "shaped";

/**
 * Where a served project runs. Exactly one target — an array would be load
 * balancing, which needs a balancer asset that does not exist yet.
 */
export type RouteTarget = { kind: "server"; serverId: string };

export interface ProjectRelationship {
	readonly trust: number;
	readonly reputation: number;
	readonly hatred: number;
}

export interface ProjectCalendarTick {
	readonly project: Project;
	readonly refundCents: number;
	readonly expired: boolean;
	readonly withdrawn: boolean;
}

export interface BillingSettlement {
	periodIndex: number;
	hoursServedInPeriod: number;
	paygCents: number;
	recurringCents: number;
	creditCents: number;
	periodPpm: number | null;
	periodRevenueCents: number;
}

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
	commercial: CommercialTerms;
	route?: RouteTarget;
	offeredHour?: number;
	offerTtlHours?: number;
	acceptedHour?: number;
	ready?: boolean;
	advancePostedCents?: number;
	setupAllowanceHours?: number;
	patienceMilliHours?: number;
	billingOriginHour?: number;
	prepaidAdvance?: boolean;
	setupServerId?: string;
	installedServiceIds?: readonly string[];
	connectionConfigured?: boolean;
	pendingTransfer?: PendingTransfer;
}

export interface PendingTransfer {
	readonly status: "pending";
	readonly sourceProjectId: string;
	readonly destinationServerId: string;
	readonly remainingNetworkMiB: number;
	readonly remainingDiskOps: number;
}

function isProjectCategory(value: string): value is ProjectCategory {
	return Object.hasOwn(TRAFFIC_POLICY.rhythm, value);
}

function parseRoute(
	id: string,
	status: ProjectStatus,
	route: RouteTarget | undefined,
): RouteTarget | undefined {
	if (status !== "served") {
		if (route !== undefined) {
			throw new Error(`only a served project can have a route: ${id}`);
		}

		return undefined;
	}

	if (route === undefined) {
		throw new Error(`served project requires a route: ${id}`);
	}

	if (route.kind !== "server" || route.serverId === "") {
		throw new Error(`invalid route for project: ${id}`);
	}

	return { kind: "server", serverId: route.serverId };
}

function parseCampaign(campaign: CampaignWindow): CampaignWindow {
	const startHour = units.asNonNegativeInteger(campaign.startHour, "startHour");
	const durationHours = units.asFiniteInteger(campaign.durationHours, "durationHours");

	if (durationHours < 1) {
		throw new Error("durationHours must be a positive integer");
	}

	return { startHour, durationHours };
}

function optionalHour(value: number | undefined, label: string): number | undefined {
	if (value === undefined) {
		return undefined;
	}

	return units.asNonNegativeInteger(value, label);
}

export class Project {
	readonly id: string;
	readonly estimatedRequestsPerHour: number;
	readonly demand: DemandKind;
	readonly category: ProjectCategory;
	readonly region: RegionId;
	readonly campaignProne: boolean;
	readonly campaign: CampaignWindow | undefined;
	readonly commercial: CommercialTerms;
	readonly offeredHour: number;
	readonly offerTtlHours: number;
	readonly acceptedHour: number | undefined;
	readonly ready: boolean;
	readonly advancePostedCents: number;
	readonly setupAllowanceHours: number;
	readonly patienceMilliHours: number | undefined;
	readonly billingOriginHour: number | undefined;
	readonly prepaidAdvance: boolean;
	readonly setupServerId: string | undefined;
	readonly installedServiceIds: readonly string[];
	readonly connectionConfigured: boolean;
	readonly pendingTransfer: PendingTransfer | undefined;
	readonly #status: ProjectStatus;
	readonly #route: RouteTarget | undefined;
	readonly #demandModel: DemandModel;
	#metrics: ProjectTickMetrics = EMPTY_PROJECT_TICK_METRICS;
	#slaHours: SlaHourSample[] = [];
	#hoursServedInPeriod = 0;
	#periodPaygCents = 0;
	#periodHandled = 0;
	#periodEmitted = 0;
	#settlements: BillingSettlement[] = [];

	constructor(initial: ProjectInitial) {
		this.id = initial.id;
		this.estimatedRequestsPerHour = units.asNonNegativeInteger(
			initial.estimatedRequestsPerHour,
			"estimatedRequestsPerHour",
		);
		this.#status = initial.status;
		this.#route = parseRoute(initial.id, initial.status, initial.route);
		this.demand = initial.demand;

		if (!isProjectCategory(initial.category)) {
			throw new Error(`unknown project category: ${initial.category}`);
		}

		this.category = initial.category;
		this.region = regions.parseRegionId(initial.region);
		this.campaignProne = initial.campaignProne;
		this.campaign = initial.campaign === undefined ? undefined : parseCampaign(initial.campaign);
		this.commercial = parseCommercialTerms(initial.commercial);
		this.offeredHour = units.asNonNegativeInteger(initial.offeredHour ?? 0, "offeredHour");
		this.offerTtlHours = units.asNonNegativeInteger(initial.offerTtlHours ?? 0, "offerTtlHours");
		this.acceptedHour = optionalHour(initial.acceptedHour, "acceptedHour");
		this.ready = initial.ready ?? (initial.status === "served" || initial.status === "offline");
		this.advancePostedCents = units.asNonNegativeInteger(
			initial.advancePostedCents ?? 0,
			"advancePostedCents",
		);
		this.setupAllowanceHours = units.asNonNegativeInteger(
			initial.setupAllowanceHours ?? FIRST_SETUP_ALLOWANCE_HOURS,
			"setupAllowanceHours",
		);
		this.patienceMilliHours =
			initial.patienceMilliHours === undefined
				? undefined
				: units.asNonNegativeInteger(initial.patienceMilliHours, "patienceMilliHours");
		this.billingOriginHour = optionalHour(
			initial.billingOriginHour ??
				(initial.status === "served" || initial.status === "offline" ? 0 : undefined),
			"billingOriginHour",
		);
		this.prepaidAdvance = initial.prepaidAdvance ?? false;
		this.setupServerId = initial.setupServerId;
		this.installedServiceIds = [...(initial.installedServiceIds ?? [])];
		this.connectionConfigured = initial.connectionConfigured ?? false;
		this.pendingTransfer = initial.pendingTransfer;
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

	get route(): RouteTarget | undefined {
		return this.#route;
	}

	get metrics(): ProjectTickMetrics {
		return this.#metrics;
	}

	get slaHours(): readonly SlaHourSample[] {
		return this.#slaHours;
	}

	get hoursServedInPeriod(): number {
		return this.#hoursServedInPeriod;
	}

	get periodPaygCents(): number {
		return this.#periodPaygCents;
	}

	get periodHandled(): number {
		return this.#periodHandled;
	}

	get periodEmitted(): number {
		return this.#periodEmitted;
	}

	get settlements(): readonly BillingSettlement[] {
		return this.#settlements;
	}

	asAccepted(hourIndex: number): Project {
		if (this.#status !== "offered") {
			throw new Error(`project is not offered: ${this.id}`);
		}

		return this.#transition("accepted", undefined, {
			acceptedHour: hourIndex,
			advancePostedCents: this.commercial.recurringCentsPerPeriod,
			prepaidAdvance: true,
			ready: false,
		});
	}

	asStarted(serverId: string, hourIndex: number): Project {
		if (this.#status !== "accepted") {
			throw new Error(`project is not accepted: ${this.id}`);
		}

		if (!this.ready) {
			throw new Error(`project is not ready: ${this.id}`);
		}

		if (this.pendingTransfer !== undefined) {
			throw new Error(`pending transfer blocks start: ${this.id}`);
		}

		return this.#transition(
			"served",
			{ kind: "server", serverId },
			{
				billingOriginHour: hourIndex,
			},
		);
	}

	withReady(): Project {
		if (this.#status !== "accepted") {
			throw new Error(`project is not accepted: ${this.id}`);
		}

		if (this.pendingTransfer !== undefined) {
			throw new Error(`pending transfer blocks ready: ${this.id}`);
		}

		return this.#transition("accepted", undefined, { ready: true });
	}

	withSetupServerId(serverId: string): Project {
		if (this.#status !== "accepted") {
			throw new Error(`project is not accepted: ${this.id}`);
		}

		return this.#transition("accepted", undefined, { setupServerId: serverId });
	}

	withInstalledService(serviceId: string): Project {
		if (this.#status !== "accepted") {
			throw new Error(`project is not accepted: ${this.id}`);
		}

		if (this.installedServiceIds.includes(serviceId)) {
			return this;
		}

		return this.#transition("accepted", undefined, {
			installedServiceIds: [...this.installedServiceIds, serviceId],
		});
	}

	withConnectionConfigured(): Project {
		if (this.#status !== "accepted") {
			throw new Error(`project is not accepted: ${this.id}`);
		}

		return this.#transition("accepted", undefined, { connectionConfigured: true });
	}

	asDuplicate(
		copyId: string,
		destinationServerId: string,
		hourIndex: number,
		payload: { remainingNetworkMiB: number; remainingDiskOps: number },
	): Project {
		if (this.#status !== "served") {
			throw new Error(`project is not served: ${this.id}`);
		}

		return new Project({
			id: copyId,
			estimatedRequestsPerHour: this.estimatedRequestsPerHour,
			status: "accepted",
			demand: this.demand,
			category: this.category,
			region: this.region,
			campaignProne: this.campaignProne,
			commercial: this.commercial,
			acceptedHour: hourIndex,
			ready: false,
			setupServerId: destinationServerId,
			pendingTransfer: {
				status: "pending",
				sourceProjectId: this.id,
				destinationServerId,
				remainingNetworkMiB: payload.remainingNetworkMiB,
				remainingDiskOps: payload.remainingDiskOps,
			},
			...(this.campaign === undefined ? {} : { campaign: this.campaign }),
		});
	}

	withTransferProgress(networkHandled: number, diskHandled: number): Project {
		if (this.pendingTransfer === undefined) {
			return this;
		}

		const remainingNetworkMiB = Math.max(
			0,
			this.pendingTransfer.remainingNetworkMiB - networkHandled,
		);
		const remainingDiskOps = Math.max(0, this.pendingTransfer.remainingDiskOps - diskHandled);

		if (remainingNetworkMiB === 0 && remainingDiskOps === 0) {
			return this.#transition("accepted", undefined, {
				pendingTransfer: undefined,
				ready: true,
			});
		}

		return this.#transition("accepted", undefined, {
			pendingTransfer: {
				...this.pendingTransfer,
				remainingNetworkMiB,
				remainingDiskOps,
			},
		});
	}

	withPatienceMilliHours(patienceMilliHours: number): Project {
		if (this.#status !== "accepted") {
			throw new Error(`project is not accepted: ${this.id}`);
		}

		return this.#transition("accepted", undefined, { patienceMilliHours });
	}

	asWithdrawn(): Project {
		if (this.#status !== "accepted") {
			throw new Error(`project is not accepted: ${this.id}`);
		}

		return this.#transition("withdrawn", undefined, { ready: false });
	}

	asExpired(): Project {
		if (this.#status !== "offered") {
			throw new Error(`project is not offered: ${this.id}`);
		}

		return this.#transition("expired", undefined);
	}

	asDeclined(): Project {
		if (this.#status !== "offered") {
			throw new Error(`project is not offered: ${this.id}`);
		}

		return this.#transition("declined", undefined);
	}

	/** Park: the customer keeps the contract, nothing runs. */
	asOffline(): Project {
		if (this.#status !== "served") {
			throw new Error(`project is not served: ${this.id}`);
		}

		return this.#transition("offline", undefined);
	}

	/** Move a served project, or bring a parked one back up. */
	asRoutedTo(serverId: string): Project {
		if (this.#status !== "served" && this.#status !== "offline") {
			throw new Error(`project is not routable: ${this.id}`);
		}

		return this.#transition("served", { kind: "server", serverId });
	}

	/**
	 * Offline hours keep filling the period SLA buckets — parking is downtime the
	 * contract saw — but they do not count as served hours, so recurring sleeps.
	 */
	accruePeriodPayg(): number {
		if (this.#status !== "served" && this.#status !== "offline") {
			return 0;
		}

		if (this.#status === "served") {
			this.#hoursServedInPeriod += 1;
		}

		const { emittedRequests, handledRequests } = this.#metrics;

		if (emittedRequests === 0) {
			return 0;
		}

		this.#periodHandled += handledRequests;
		this.#periodEmitted += emittedRequests;

		if (this.#status !== "served") {
			return 0;
		}

		const paygCents = paygCentsForHandled(
			handledRequests,
			this.commercial.paygCentsPerThousandHandled,
		);

		this.#periodPaygCents += paygCents;

		return paygCents;
	}

	closeIfDue(hourIndex: number): number {
		const origin = this.billingOriginHour;

		if (origin === undefined) {
			return 0;
		}

		if (hourIndex <= origin) {
			return 0;
		}

		if ((hourIndex - origin) % BILLING_PERIOD_HOURS !== 0) {
			return 0;
		}

		return this.closeBillingPeriod(Math.floor((hourIndex - origin) / BILLING_PERIOD_HOURS));
	}

	closeBillingPeriod(periodIndex: number): number {
		if (this.#hoursServedInPeriod === 0 && this.#periodEmitted === 0) {
			return 0;
		}

		const hoursServedInPeriod = this.#hoursServedInPeriod;
		const paygCents = this.#periodPaygCents;
		const recurringCents = Math.floor(
			(this.commercial.recurringCentsPerPeriod * hoursServedInPeriod) / BILLING_PERIOD_HOURS,
		);
		const periodRevenueCents = paygCents + recurringCents;
		const periodPpm = slaAvailabilityPpm(this.#periodHandled, this.#periodEmitted);
		const creditPpm = slaCreditPpm(periodPpm, this.commercial.targetPpm);
		const creditCents =
			creditPpm === 0
				? 0
				: Math.min(periodRevenueCents, Math.floor((periodRevenueCents * creditPpm) / 1_000_000));

		this.#settlements.push({
			periodIndex,
			hoursServedInPeriod,
			paygCents,
			recurringCents,
			creditCents,
			periodPpm,
			periodRevenueCents,
		});

		if (this.#settlements.length > SETTLEMENT_HISTORY_K) {
			this.#settlements = this.#settlements.slice(-SETTLEMENT_HISTORY_K);
		}

		this.#hoursServedInPeriod = 0;
		this.#periodPaygCents = 0;
		this.#periodHandled = 0;
		this.#periodEmitted = 0;

		if (this.prepaidAdvance) {
			return -creditCents;
		}

		return recurringCents - creditCents;
	}

	recordSlaHour(hour: ProjectSlaHour): void {
		if (hour.emittedRequests > 0) {
			this.#slaHours.push({ handled: hour.handledRequests, emitted: hour.emittedRequests });

			if (this.#slaHours.length > SLA_WINDOW_HOURS) {
				this.#slaHours.shift();
			}
		}

		this.#metrics = {
			emittedRequests: hour.emittedRequests,
			handledRequests: hour.handledRequests,
			unroutableRequests: hour.unroutableRequests,
			capacityDropRequests: hour.capacityDropRequests,
			availabilityPpm: slaAvailabilityPpm(hour.handledRequests, hour.emittedRequests),
			windowAvailabilityPpm: windowAvailabilityPpm(this.#slaHours),
		};
	}

	/**
	 * Offline emits like served. Reusing the "not served, emit 0" branch would
	 * freeze the SLA ring and turn parking into free uptime.
	 */
	tick(hourIndex: number, random: RandomSource): number {
		if (this.#status !== "served" && this.#status !== "offline") {
			this.#metrics = EMPTY_PROJECT_TICK_METRICS;

			return 0;
		}

		return this.recordEmitted(this.#demandModel.demandFor(hourIndex, random));
	}

	recordEmitted(emittedRequests: number): number {
		if (this.#status !== "served" && this.#status !== "offline") {
			this.#metrics = EMPTY_PROJECT_TICK_METRICS;

			return 0;
		}

		this.#metrics = measureProjectTick(emittedRequests);

		return this.#metrics.emittedRequests;
	}

	tickCalendar(hourIndex: number, relationship: ProjectRelationship): ProjectCalendarTick {
		if (
			this.#status === "offered" &&
			this.offerTtlHours > 0 &&
			hourIndex - this.offeredHour >= this.offerTtlHours
		) {
			return {
				project: this.asExpired(),
				refundCents: 0,
				expired: true,
				withdrawn: false,
			};
		}

		if (this.#status !== "accepted" || this.ready || this.acceptedHour === undefined) {
			return {
				project: this,
				refundCents: 0,
				expired: false,
				withdrawn: false,
			};
		}

		const elapsed = hourIndex - this.acceptedHour;

		if (elapsed < this.setupAllowanceHours) {
			return {
				project: this,
				refundCents: 0,
				expired: false,
				withdrawn: false,
			};
		}

		if (this.patienceMilliHours === undefined) {
			return {
				project: this.withPatienceMilliHours(
					setupPatienceMilliHours(relationship.trust, relationship.reputation, relationship.hatred),
				),
				refundCents: 0,
				expired: false,
				withdrawn: false,
			};
		}

		const remaining = Math.max(0, this.patienceMilliHours - 1_000);

		if (remaining > 0) {
			return {
				project: this.withPatienceMilliHours(remaining),
				refundCents: 0,
				expired: false,
				withdrawn: false,
			};
		}

		return {
			project: this.asWithdrawn(),
			refundCents: this.advancePostedCents,
			expired: false,
			withdrawn: true,
		};
	}

	#transition(
		status: ProjectStatus,
		route: RouteTarget | undefined,
		overrides: Partial<ProjectInitial> = {},
	): Project {
		const next = new Project({
			id: this.id,
			estimatedRequestsPerHour: this.estimatedRequestsPerHour,
			status,
			demand: this.demand,
			category: this.category,
			region: this.region,
			campaignProne: this.campaignProne,
			commercial: this.commercial,
			offeredHour: this.offeredHour,
			offerTtlHours: this.offerTtlHours,
			acceptedHour: this.acceptedHour,
			ready: this.ready,
			advancePostedCents: this.advancePostedCents,
			setupAllowanceHours: this.setupAllowanceHours,
			patienceMilliHours: this.patienceMilliHours,
			billingOriginHour: this.billingOriginHour,
			prepaidAdvance: this.prepaidAdvance,
			setupServerId: this.setupServerId,
			installedServiceIds: this.installedServiceIds,
			connectionConfigured: this.connectionConfigured,
			pendingTransfer: this.pendingTransfer,
			...(this.campaign === undefined ? {} : { campaign: this.campaign }),
			...(route === undefined ? {} : { route }),
			...overrides,
		});

		next.#slaHours = this.#slaHours.slice();
		next.#metrics = this.#metrics;
		next.#hoursServedInPeriod = this.#hoursServedInPeriod;
		next.#periodPaygCents = this.#periodPaygCents;
		next.#periodHandled = this.#periodHandled;
		next.#periodEmitted = this.#periodEmitted;
		next.#settlements = this.#settlements.slice();

		return next;
	}
}

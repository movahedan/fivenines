import {
	ACQUAINTANCE_OFFERS,
	type AcquaintanceOfferSpec,
	APPOINTMENT_COMMERCIAL,
	APPOINTMENT_SITE_BASELINE,
} from "./catalog/acquaintance-offer";
import {
	OFFER_INTERVAL_HOURS_AT_REPUTATION_ZERO,
	OFFER_TTL_HOURS,
	PENDING_OFFER_CAP_AT_REPUTATION_ZERO,
	SETUP_WITHDRAWAL_REPUTATION_DELTA,
	setupPatienceMilliHours,
} from "./catalog/contract-policy";
import { Customer } from "./customer";
import { postCashDelta } from "./game.utils";
import { Project, type ProjectInitial } from "./project";

export interface SetupTickResult {
	readonly customers: readonly Customer[];
	readonly cashCents: number;
	readonly reputation: number;
	readonly lastOfferResolveHour: number;
}

function withProjects(customer: Customer, projects: readonly Project[]): Customer {
	return new Customer(
		{
			id: customer.id,
			trust: customer.trust,
			hatred: customer.hatred,
			projects: [],
		},
		projects,
	);
}

function offeredCount(customers: readonly Customer[]): number {
	return customers.reduce(
		(count, customer) =>
			count + customer.projects.filter((project) => project.status === "offered").length,
		0,
	);
}

function knownProjectIds(customers: readonly Customer[]): Set<string> {
	return new Set(customers.flatMap((customer) => customer.projects.map((project) => project.id)));
}

function nextAcquaintanceSpec(customers: readonly Customer[]): AcquaintanceOfferSpec | undefined {
	const ids = knownProjectIds(customers);

	return ACQUAINTANCE_OFFERS.find((spec) => !ids.has(spec.projectId));
}

function acquaintanceInitial(spec: AcquaintanceOfferSpec, hourIndex: number): ProjectInitial {
	return {
		id: spec.projectId,
		estimatedRequestsPerHour: APPOINTMENT_SITE_BASELINE,
		status: "offered",
		demand: "shaped",
		category: "saas",
		region: spec.region,
		campaignProne: false,
		commercial: APPOINTMENT_COMMERCIAL,
		offeredHour: hourIndex,
		offerTtlHours: OFFER_TTL_HOURS,
		setupAllowanceHours: spec.setupAllowanceHours,
	};
}

function spawnAcquaintance(
	customers: readonly Customer[],
	spec: AcquaintanceOfferSpec,
	hourIndex: number,
): readonly Customer[] {
	const spawned = new Project(acquaintanceInitial(spec, hourIndex));
	const existing = customers.find((customer) => customer.id === spec.customerId);

	if (existing === undefined) {
		return [
			...customers,
			new Customer(
				{
					id: spec.customerId,
					trust: spec.trust,
					hatred: spec.hatred,
					projects: [],
				},
				[spawned],
			),
		];
	}

	return customers.map((customer) => {
		if (customer.id !== spec.customerId) {
			return customer;
		}

		return withProjects(customer, [...customer.projects, spawned]);
	});
}

function tickCustomerSetup(
	customer: Customer,
	hourIndex: number,
	reputation: number,
): { customer: Customer; refundCents: number; withdrawn: boolean; expired: boolean } {
	let refundCents = 0;
	let withdrawn = false;
	let expired = false;
	const projects = customer.projects.map((project) => {
		if (
			project.status === "offered" &&
			project.offerTtlHours > 0 &&
			hourIndex - project.offeredHour >= project.offerTtlHours
		) {
			expired = true;

			return project.asExpired();
		}

		if (project.status !== "accepted" || project.ready || project.acceptedHour === undefined) {
			return project;
		}

		const elapsed = hourIndex - project.acceptedHour;

		if (elapsed < project.setupAllowanceHours) {
			return project;
		}

		if (project.patienceMilliHours === undefined) {
			return project.withPatienceMilliHours(
				setupPatienceMilliHours(customer.trust, reputation, customer.hatred),
			);
		}

		const remaining = Math.max(0, project.patienceMilliHours - 1_000);

		if (remaining > 0) {
			return project.withPatienceMilliHours(remaining);
		}

		refundCents += project.advancePostedCents;
		withdrawn = true;

		return project.asWithdrawn();
	});

	return {
		customer: withProjects(customer, projects),
		refundCents,
		withdrawn,
		expired,
	};
}

export function tickSetupContracts(
	customers: readonly Customer[],
	cashCents: number,
	reputation: number,
	hourIndex: number,
	lastOfferResolveHour: number,
): SetupTickResult {
	let nextCash = cashCents;
	let nextReputation = reputation;
	let nextResolveHour = lastOfferResolveHour;
	let nextCustomers = customers.map((customer) => {
		const ticked = tickCustomerSetup(customer, hourIndex, reputation);

		nextCash = postCashDelta(nextCash, -ticked.refundCents);

		if (ticked.withdrawn) {
			nextReputation += SETUP_WITHDRAWAL_REPUTATION_DELTA;
			nextResolveHour = hourIndex;
		}

		if (ticked.expired) {
			nextResolveHour = hourIndex;
		}

		return ticked.customer;
	});

	if (
		offeredCount(nextCustomers) < PENDING_OFFER_CAP_AT_REPUTATION_ZERO &&
		hourIndex - nextResolveHour >= OFFER_INTERVAL_HOURS_AT_REPUTATION_ZERO
	) {
		const spec = nextAcquaintanceSpec(nextCustomers);

		if (spec !== undefined) {
			nextCustomers = [...spawnAcquaintance(nextCustomers, spec, hourIndex)];
		}
	}

	return {
		customers: nextCustomers,
		cashCents: nextCash,
		reputation: nextReputation,
		lastOfferResolveHour: nextResolveHour,
	};
}

export function markOfferResolved(hourIndex: number, lastOfferResolveHour: number): number {
	return Math.max(lastOfferResolveHour, hourIndex);
}

export { acquaintanceInitial };

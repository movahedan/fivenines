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
} from "./catalog/contract-policy";
import { Customer } from "./customer";
import { Project, type ProjectInitial } from "./project";

export interface OfferMarketTick {
	readonly customers: readonly Customer[];
	readonly lastOfferResolveHour: number;
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

		return customer.withProjects([...customer.projects, spawned]);
	});
}

export function spawnAcquaintanceIfDue(
	customers: readonly Customer[],
	hourIndex: number,
	lastOfferResolveHour: number,
): OfferMarketTick {
	if (
		offeredCount(customers) >= PENDING_OFFER_CAP_AT_REPUTATION_ZERO ||
		hourIndex - lastOfferResolveHour < OFFER_INTERVAL_HOURS_AT_REPUTATION_ZERO
	) {
		return {
			customers,
			lastOfferResolveHour,
		};
	}

	const spec = nextAcquaintanceSpec(customers);

	if (spec === undefined) {
		return {
			customers,
			lastOfferResolveHour,
		};
	}

	return {
		customers: spawnAcquaintance(customers, spec, hourIndex),
		lastOfferResolveHour,
	};
}

export function markOfferResolved(hourIndex: number, lastOfferResolveHour: number): number {
	return Math.max(lastOfferResolveHour, hourIndex);
}

export { acquaintanceInitial };

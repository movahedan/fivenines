import type { CommercialTerms } from "./commercial-policy";
import {
	ACQUAINTANCE_TRUST,
	DEFAULT_HATRED,
	designUnitsToCents,
	FIRST_SETUP_ALLOWANCE_HOURS,
	slaPercentToPpm,
} from "./contract-policy";
import type { RegionId } from "./regions";

export const APPOINTMENT_SITE_BASELINE = 120;
export const APPOINTMENT_SLA_PERCENT = 80;
export const APPOINTMENT_WEEKLY_FEE_DESIGN = 80;

export const APPOINTMENT_COMMERCIAL: CommercialTerms = {
	paygCentsPerThousandHandled: 0,
	recurringCentsPerPeriod: designUnitsToCents(APPOINTMENT_WEEKLY_FEE_DESIGN),
	targetPpm: slaPercentToPpm(APPOINTMENT_SLA_PERCENT),
	creditPpm: 1_000_000,
};

export interface AcquaintanceOfferSpec {
	readonly customerId: string;
	readonly customerName: string;
	readonly projectId: string;
	readonly projectName: string;
	readonly region: RegionId;
	readonly trust: number;
	readonly hatred: number;
	readonly setupAllowanceHours: number;
}

export const ACQUAINTANCE_OFFERS: readonly AcquaintanceOfferSpec[] = [
	{
		customerId: "maya",
		customerName: "Maya Chen",
		projectId: "maya-appointments",
		projectName: "Maya's Appointments",
		region: "utc+0",
		trust: ACQUAINTANCE_TRUST,
		hatred: DEFAULT_HATRED,
		setupAllowanceHours: FIRST_SETUP_ALLOWANCE_HOURS,
	},
	{
		customerId: "lee",
		customerName: "Lee Park",
		projectId: "lee-appointments",
		projectName: "Lee's Appointments",
		region: "utc+0",
		trust: ACQUAINTANCE_TRUST,
		hatred: DEFAULT_HATRED,
		setupAllowanceHours: FIRST_SETUP_ALLOWANCE_HOURS,
	},
];

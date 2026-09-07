import type { ProjectStatus } from "../project";

export const OPENING_SHIFT_HOURS = 14 * 24;

export type OpeningShiftStatus = "in_progress" | "won" | "lost";

export interface OpeningShiftSettlementView {
	readonly periodRevenueCents: number;
	readonly creditCents: number;
}

export interface OpeningShiftProjectView {
	readonly status: ProjectStatus;
	readonly windowAvailabilityPpm: number | null;
	readonly targetPpm: number;
	readonly settlements: readonly OpeningShiftSettlementView[];
}

export interface OpeningShiftSnapshot {
	readonly hourIndex: number;
	readonly cashCents: number;
	readonly jailed: boolean;
	readonly projects: readonly OpeningShiftProjectView[];
}

export type OpeningShiftFailReason = "jailed" | "cash" | "contracts" | "catastrophe";

export interface OpeningShiftOutcome {
	readonly status: OpeningShiftStatus;
	readonly failed: readonly OpeningShiftFailReason[];
}

export function openingShiftOutcome(snapshot: OpeningShiftSnapshot): OpeningShiftOutcome {
	if (snapshot.hourIndex < OPENING_SHIFT_HOURS) {
		return { status: "in_progress", failed: [] };
	}

	const failed: OpeningShiftFailReason[] = [];

	if (snapshot.jailed) {
		failed.push("jailed");
	}

	if (snapshot.cashCents <= 0) {
		failed.push("cash");
	}

	const healthyContracts = snapshot.projects.filter((project) => {
		if (project.status !== "served") {
			return false;
		}

		if (project.windowAvailabilityPpm === null) {
			return false;
		}

		return project.windowAvailabilityPpm >= project.targetPpm;
	}).length;

	if (healthyContracts < 2) {
		failed.push("contracts");
	}

	const catastrophe = snapshot.projects.some((project) =>
		project.settlements.some(
			(settlement) =>
				settlement.periodRevenueCents > 0 &&
				settlement.creditCents === settlement.periodRevenueCents,
		),
	);

	if (catastrophe) {
		failed.push("catastrophe");
	}

	if (failed.length > 0) {
		return { status: "lost", failed };
	}

	return { status: "won", failed: [] };
}

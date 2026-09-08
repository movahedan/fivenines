import type {
	EngineEvent,
	Game,
	OpeningShiftFailReason,
	OpeningShiftOutcome,
	OpeningShiftSnapshot,
	Project,
	RegionId,
	ServerCatalogId,
} from "@packages/fivenines-engine";
import {
	openingShiftOutcome,
	SERVER_CATALOG,
	SKU_ECONOMY,
	slaRecoveryHours,
} from "@packages/fivenines-engine";
import { formatters } from "@packages/shared/formatters";
import { units } from "@packages/shared/units";

import type { EventLogTone } from "@/molecules/event-log/event-log";

export const REGION_CLASS: Record<RegionId, string> = {
	"utc-8": "bg-info/20 text-info",
	"utc-5": "bg-warning/20 text-warning",
	"utc+0": "bg-primary/20 text-primary",
	"utc+1": "bg-sla/20 text-sla",
	"utc+9": "bg-destructive/20 text-destructive",
};

export const SKU_DOT_CLASS: Record<ServerCatalogId, string> = {
	bronze: "bg-warning shadow-glow-warning",
	silver: "bg-muted-foreground shadow-glow-info",
	gold: "bg-warning shadow-glow-warning",
	platinum: "bg-sla shadow-glow-sla",
	diamond: "bg-info shadow-glow-info",
	"thin-ram": "bg-sla shadow-glow-sla",
};

export function slaPercent(windowAvailabilityPpm: number | null): number {
	if (windowAvailabilityPpm === null) {
		return 0;
	}

	return Math.min(100, Math.max(0, Math.round(windowAvailabilityPpm / 10_000)));
}

export function sparklineFromSlaHours(project: Project): readonly number[] {
	return project.slaHours.map((sample) => {
		if (sample.emitted === 0) {
			return 0;
		}

		return sample.handled / sample.emitted;
	});
}

export function slaShareLabel(availabilityPpm: number | null): string {
	return formatters.ppm(availabilityPpm);
}

export function recoveryEtaLabel(project: Project): string {
	const hours = slaRecoveryHours(project.slaHours, project.commercial.targetPpm);

	if (hours === null) {
		return "—";
	}

	return `${String(hours)} healthy hours`;
}

export function sparklineTargetFromPpm(targetPpm: number): number {
	return targetPpm / 1_000_000;
}

export function slaTone(
	windowAvailabilityPpm: number | null,
	targetPpm: number,
): "primary" | "warning" | "destructive" | "sla" {
	if (windowAvailabilityPpm === null) {
		return "sla";
	}

	if (windowAvailabilityPpm >= targetPpm) {
		return "primary";
	}

	if (windowAvailabilityPpm >= 950_000) {
		return "warning";
	}

	return "destructive";
}

export function slaStatusLabel(windowAvailabilityPpm: number | null, targetPpm: number): string {
	if (windowAvailabilityPpm === null) {
		return "warming";
	}

	if (windowAvailabilityPpm >= targetPpm) {
		return "meeting";
	}

	if (windowAvailabilityPpm >= 950_000) {
		return "at risk";
	}

	return "breach";
}

export function skuCostLabel(catalogId: ServerCatalogId): string {
	return formatters.cents(SKU_ECONOMY[catalogId].purchaseCents);
}

export function skuOpexLabel(catalogId: ServerCatalogId): string {
	const sku = SKU_ECONOMY[catalogId];

	return `${formatters.cents(sku.maintenanceCentsPerHour + sku.idlePowerCentsPerHour)}/h idle`;
}

export function skuCpuLabel(catalogId: ServerCatalogId): string {
	return formatters.cores(SERVER_CATALOG[catalogId].computeUnitsPerHour);
}

export function skuRamLabel(catalogId: ServerCatalogId): string {
	return `${String(SERVER_CATALOG[catalogId].memoryMiB)} MiB`;
}

export function skuNetLabel(catalogId: ServerCatalogId): string {
	return `${String(SERVER_CATALOG[catalogId].networkBytesPerHour)} B/h`;
}

export function axisPercent(load: number, cap: number): number {
	return units.ratioPercent(load, cap);
}

export function commandLogTone(commandType: string): EventLogTone {
	if (commandType === "sellServer" || commandType === "declineProject") {
		return "warn";
	}

	if (commandType === "buyServer") {
		return "success";
	}

	return "info";
}

export function engineEventTone(event: EngineEvent): EventLogTone {
	if (event.type === "slaRecovered" || event.type === "paygSettled") {
		return "success";
	}

	if (event.type === "weeklyCreditCharged") {
		return "warn";
	}

	if (
		event.type === "slaBreached" ||
		event.type === "serverSaturated" ||
		event.type === "cashLow"
	) {
		return "danger";
	}

	return "info";
}

export function engineEventMessage(event: EngineEvent): string {
	switch (event.type) {
		case "slaBreached":
			return `SLA breached ${event.projectId} (${slaShareLabel(event.windowPpm)})`;
		case "slaRecovered":
			return `SLA recovered ${event.projectId} (${slaShareLabel(event.windowPpm)})`;
		case "paygSettled":
			return `PAYG settled ${formatters.cents(event.cents)}`;
		case "weeklyCreditCharged":
			return `Weekly credit ${event.projectId} ${formatters.cents(event.creditCents)}`;
		case "serverSaturated":
			return `Server saturated ${event.serverId}`;
		case "cashLow":
			return `Cash low ${formatters.cents(event.cashCents)}`;
	}
}

export function openingShiftSnapshot(game: Game): OpeningShiftSnapshot {
	return {
		hourIndex: game.hourIndex,
		cashCents: game.cashCents,
		jailed: game.jailed,
		projects: game.customers.flatMap((customer) =>
			customer.projects.map((project) => ({
				status: project.status,
				windowAvailabilityPpm: project.metrics.windowAvailabilityPpm,
				targetPpm: project.commercial.targetPpm,
				settlements: project.settlements.map((settlement) => ({
					periodRevenueCents: settlement.periodRevenueCents,
					creditCents: settlement.creditCents,
				})),
			})),
		),
	};
}

export function evaluateOpeningShift(game: Game): OpeningShiftOutcome {
	return openingShiftOutcome(openingShiftSnapshot(game));
}

const OPENING_SHIFT_FAIL_COPY: Record<OpeningShiftFailReason, string> = {
	jailed: "The shift ended in jail.",
	cash: "Cash was not positive.",
	contracts: "Fewer than two contracts met their SLA target.",
	catastrophe: "A billing period took a 100% SLA credit.",
};

export function openingShiftResultCopy(outcome: OpeningShiftOutcome): {
	readonly title: string;
	readonly body: string;
} {
	if (outcome.status === "in_progress") {
		return { title: "", body: "" };
	}

	if (outcome.status === "won") {
		return {
			title: "Opening Shift complete",
			body: "Positive cash, two healthy contracts, and no catastrophic settlement.",
		};
	}

	return {
		title: "Opening Shift failed",
		body: outcome.failed.map((reason) => OPENING_SHIFT_FAIL_COPY[reason]).join(" "),
	};
}

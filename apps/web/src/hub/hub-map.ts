import type { Project, RegionId, ServerCatalogId } from "@packages/fivenines-engine";
import { SERVER_CATALOG, SKU_ECONOMY } from "@packages/fivenines-engine";

import type { EventLogTone } from "@/molecules/event-log/event-log";

export const REGION_CLASS: Record<RegionId, string> = {
	"utc-8": "bg-info/20 text-info",
	"utc-5": "bg-warning/20 text-warning",
	"utc+0": "bg-primary/20 text-primary",
	"utc+1": "bg-sla/20 text-sla",
	"utc+9": "bg-destructive/20 text-destructive",
};

export function formatCents(cents: number): string {
	const sign = cents < 0 ? "-" : "";
	const absolute = Math.abs(cents);
	const dollars = Math.floor(absolute / 100);
	const remainder = absolute % 100;

	return `${sign}$${String(dollars)}.${String(remainder).padStart(2, "0")}`;
}

export function formatHourTick(hourIndex: number): string {
	return `T+${String(hourIndex).padStart(4, "0")}`;
}

export function formatClockLabel(hourIndex: number): string {
	const dayIndex = Math.floor(hourIndex / 24);
	const hourOfDay = hourIndex % 24;

	return `D${String(dayIndex)} H${String(hourOfDay).padStart(2, "0")}`;
}

export function formatPpm(value: number | null): string {
	return value === null ? "—" : `${String(value)} ppm`;
}

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
	return formatCents(SKU_ECONOMY[catalogId].purchaseCents);
}

export function skuOpexLabel(catalogId: ServerCatalogId): string {
	const sku = SKU_ECONOMY[catalogId];

	return `${formatCents(sku.maintenanceCentsPerHour + sku.idlePowerCentsPerHour)}/h idle`;
}

export function skuCpuLabel(catalogId: ServerCatalogId): string {
	return `${String(SERVER_CATALOG[catalogId].computeUnitsPerHour)} cu`;
}

export function skuRamLabel(catalogId: ServerCatalogId): string {
	return `${String(SERVER_CATALOG[catalogId].memoryMiB)} MiB`;
}

export function utilTone(utilization: number): "primary" | "warning" | "destructive" {
	if (utilization >= 90) {
		return "destructive";
	}

	if (utilization >= 70) {
		return "warning";
	}

	return "primary";
}

export function commandLogTone(commandType: string): EventLogTone {
	if (commandType === "sellServer") {
		return "warn";
	}

	if (commandType === "buyServer") {
		return "success";
	}

	return "info";
}

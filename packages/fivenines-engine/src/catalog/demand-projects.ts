import type { DemandRhythmId } from "./demand-rhythms";
import { type DemandRelease, type DemandTypeId, demandTypeById } from "./demand-types";
import type { DemandVariationId } from "./demand-variation";

export type DemandKind = "hourly" | "finite";

export interface MixShare {
	readonly demandTypeId: DemandTypeId;
	readonly permille: number;
}

export interface HourlyDemandTemplate {
	readonly id: string;
	readonly kind: "hourly";
	readonly baselineUnitsPerHour: number;
	readonly rhythm: DemandRhythmId;
	readonly variation: DemandVariationId;
	readonly release: DemandRelease;
	readonly mix: readonly MixShare[];
}

export interface FiniteDemandTemplate {
	readonly id: string;
	readonly kind: "finite";
	readonly demandTypeId: DemandTypeId;
	readonly release: DemandRelease;
}

export type DemandTemplate = HourlyDemandTemplate | FiniteDemandTemplate;

function mix(entries: ReadonlyArray<readonly [DemandTypeId, number]>): readonly MixShare[] {
	const shares = entries.map(([demandTypeId, permille]) => {
		demandTypeById(demandTypeId);

		return { demandTypeId, permille };
	});
	const total = shares.reduce((sum, share) => sum + share.permille, 0);

	if (total !== 1000) {
		throw new Error(`mix permille must sum to 1000: ${String(total)}`);
	}

	return shares;
}

function hourly(
	id: string,
	baselineUnitsPerHour: number,
	rhythm: DemandRhythmId,
	variation: DemandVariationId,
	release: DemandRelease,
	entries: ReadonlyArray<readonly [DemandTypeId, number]>,
): HourlyDemandTemplate {
	return {
		id,
		kind: "hourly",
		baselineUnitsPerHour,
		rhythm,
		variation,
		release,
		mix: mix(entries),
	};
}

function finite(id: DemandTypeId, release: DemandRelease): FiniteDemandTemplate {
	demandTypeById(id);

	return { id, kind: "finite", demandTypeId: id, release };
}

export const HOURLY_DEMAND_TEMPLATES: Record<string, HourlyDemandTemplate> = {
	"appointment-site": hourly("appointment-site", 120, "office", "early", "v1", [
		["page-read", 800],
		["record-write", 200],
	]),
	"community-site": hourly("community-site", 240, "evening", "early", "v1", [
		["page-read", 900],
		["record-write", 100],
	]),
	"online-shop": hourly("online-shop", 1000, "evening", "standard", "v1", [
		["page-read", 900],
		["record-write", 70],
		["payment", 30],
	]),
	"support-chat": hourly("support-chat", 1800, "office", "standard", "v1", [
		["chat-message", 850],
		["page-read", 100],
		["record-write", 50],
	]),
	"mailbox-service": hourly("mailbox-service", 1000, "office", "standard", "v1", [
		["email-message", 300],
		["mailbox-read", 700],
	]),
	"dns-hosting": hourly("dns-hosting", 10_000, "flat", "standard", "v1", [["dns-query", 1000]]),
	"video-library": hourly("video-library", 600, "evening", "volatile", "v1", [
		["video-minute", 1000],
	]),
	"live-events": hourly("live-events", 1200, "event", "volatile", "v1", [["live-minute", 1000]]),
	conferencing: hourly("conferencing", 600, "office", "standard", "expansion", [
		["call-minute", 1000],
	]),
	"multiplayer-hosting": hourly("multiplayer-hosting", 600, "evening", "volatile", "expansion", [
		["game-session-minute", 1000],
	]),
	"inference-api": hourly("inference-api", 300, "flat", "standard", "v1", [
		["inference-gpu", 1000],
	]),
	"event-platform": hourly("event-platform", 3000, "office", "standard", "expansion", [
		["event-ingest", 1000],
	]),
};

export const FINITE_DEMAND_TEMPLATES: Record<string, FiniteDemandTemplate> = {
	"analytics-job": finite("analytics-job", "expansion"),
	"transcode-job": finite("transcode-job", "v1"),
	"batch-job": finite("batch-job", "v1"),
	"training-job": finite("training-job", "expansion"),
	"distributed-training-job": finite("distributed-training-job", "expansion"),
};

export function hourlyTemplateById(id: string): HourlyDemandTemplate {
	const template = HOURLY_DEMAND_TEMPLATES[id];

	if (template === undefined) {
		throw new Error(`unknown hourly demand template: ${id}`);
	}

	return template;
}

export function finiteTemplateById(id: string): FiniteDemandTemplate {
	const template = FINITE_DEMAND_TEMPLATES[id];

	if (template === undefined) {
		throw new Error(`unknown finite demand template: ${id}`);
	}

	return template;
}

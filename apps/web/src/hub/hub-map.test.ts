import { describe, expect, it } from "bun:test";

import {
	addedAssetId,
	axisPercent,
	engineEventMessage,
	openingShiftResultCopy,
	SKU_DOT_CLASS,
	skuCostLabel,
	skuCpuLabel,
	skuFleetOpexLabel,
	skuLeaseLabel,
	skuNetLabel,
	slaPercent,
	slaShareLabel,
	slaStatusLabel,
	sparklineTargetFromPpm,
} from "./hub-map";

describe("hub-map - sla and sku labels", () => {
	it("maps window ppm onto a 0-100 bar and status words", () => {
		expect(slaPercent(null)).toBe(0);
		expect(slaPercent(990_000)).toBe(99);
		expect(slaStatusLabel(null, 990_000)).toBe("warming");
		expect(slaStatusLabel(995_000, 990_000)).toBe("meeting");
		expect(slaStatusLabel(960_000, 990_000)).toBe("at risk");
		expect(slaStatusLabel(800_000, 990_000)).toBe("breach");
	});

	it("formats idle SKU money and compute labels", () => {
		expect(skuCostLabel("bronze")).toBe("$180.00");
		expect(skuCpuLabel("bronze")).toBe("1000 cores");
		expect(skuNetLabel("bronze")).toBe("1000000 B/h");
		expect(SKU_DOT_CLASS.bronze).toContain("shadow-glow-warning");
	});

	it("formats lease rent from catalog hourly cents", () => {
		expect(skuLeaseLabel("bronze")).toBe("$1.47/h rent");
	});

	it("adds rent into the fleet opex label for a leased box", () => {
		expect(skuFleetOpexLabel("bronze", { kind: "leased", hourlyCents: 147 })).toBe(
			"$2.62/h idle+rent",
		);
		expect(skuFleetOpexLabel("bronze", { kind: "owned", purchaseCents: 18_000 })).toBe(
			"$1.15/h idle",
		);
	});

	it("returns the id that was not in the previous set", () => {
		expect(addedAssetId(new Set(["server-1"]), [{ id: "server-1" }, { id: "server-2" }])).toBe(
			"server-2",
		);
	});

	it("maps load versus cap onto an integer percent", () => {
		expect(axisPercent(0, 1000)).toBe(0);
		expect(axisPercent(400, 1000)).toBe(40);
		expect(axisPercent(256, 4096)).toBe(6);
	});

	it("formats availability ppm as a percent share", () => {
		expect(slaShareLabel(null)).toBe("—");
		expect(slaShareLabel(1_000_000)).toBe("100.00%");
		expect(slaShareLabel(822_700)).toBe("82.27%");
		expect(sparklineTargetFromPpm(990_000)).toBe(0.99);
	});

	it("formats a PAYG settle event as a log line", () => {
		expect(engineEventMessage({ type: "paygSettled", hourIndex: 24, cents: 100 })).toBe(
			"PAYG settled $1.00",
		);
	});

	it("writes Opening Shift win copy when the outcome is won", () => {
		expect(openingShiftResultCopy({ status: "won", failed: [] })).toEqual({
			title: "Opening Shift complete",
			body: "Positive cash, two healthy contracts, and no catastrophic settlement.",
		});
		expect(openingShiftResultCopy({ status: "lost", failed: ["cash", "contracts"] }).title).toBe(
			"Opening Shift failed",
		);
	});
});

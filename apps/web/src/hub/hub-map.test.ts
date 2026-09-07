import { describe, expect, it } from "bun:test";

import {
	axisPercent,
	engineEventMessage,
	skuCostLabel,
	skuCpuLabel,
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
		expect(skuCpuLabel("bronze")).toBe("1000 cu");
		expect(skuNetLabel("bronze")).toBe("1000000 B/h");
	});

	it("maps load versus cap onto an integer percent", () => {
		expect(axisPercent(0, 1000)).toBe(0);
		expect(axisPercent(400, 1000)).toBe(40);
		expect(axisPercent(256, 4096)).toBe(6);
	});

	it("formats availability ppm as a percent share", () => {
		expect(slaShareLabel(null)).toBe("—");
		expect(slaShareLabel(1_000_000)).toBe("100%");
		expect(slaShareLabel(822_700)).toBe("82.27%");
		expect(sparklineTargetFromPpm(990_000)).toBe(0.99);
	});

	it("formats a PAYG settle event as a log line", () => {
		expect(engineEventMessage({ type: "paygSettled", hourIndex: 24, cents: 100 })).toBe(
			"PAYG settled $1.00",
		);
	});
});

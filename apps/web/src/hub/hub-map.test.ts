import { describe, expect, it } from "bun:test";

import {
	formatCents,
	formatHourTick,
	formatPpm,
	skuCostLabel,
	skuCpuLabel,
	slaPercent,
	slaStatusLabel,
} from "./hub-map";

describe("hub-map - money and sla labels", () => {
	it("formats signed cents as dollars", () => {
		expect(formatCents(25_000)).toBe("$250.00");
		expect(formatCents(-150)).toBe("-$1.50");
	});

	it("pads the hour tick label", () => {
		expect(formatHourTick(0)).toBe("T+0000");
		expect(formatHourTick(24)).toBe("T+0024");
	});

	it("maps window ppm onto a 0-100 bar and status words", () => {
		expect(slaPercent(null)).toBe(0);
		expect(slaPercent(990_000)).toBe(99);
		expect(slaStatusLabel(null, 990_000)).toBe("warming");
		expect(slaStatusLabel(995_000, 990_000)).toBe("meeting");
		expect(slaStatusLabel(960_000, 990_000)).toBe("at risk");
		expect(slaStatusLabel(800_000, 990_000)).toBe("breach");
	});

	it("formats SLA ppm and idle SKU money labels", () => {
		expect(formatPpm(null)).toBe("—");
		expect(formatPpm(990_000)).toBe("990000 ppm");
		expect(skuCostLabel("bronze")).toBe("$180.00");
		expect(skuCpuLabel("bronze")).toBe("1000 cu");
	});
});

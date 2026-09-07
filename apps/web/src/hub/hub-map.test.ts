import { describe, expect, it } from "bun:test";

import { skuCostLabel, skuCpuLabel, slaPercent, slaStatusLabel } from "./hub-map";

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
	});
});

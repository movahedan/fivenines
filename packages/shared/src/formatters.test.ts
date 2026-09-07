import { describe, expect, it } from "bun:test";

import { formatters } from "./formatters";

describe("formatters - display labels", () => {
	it("formats signed cents as dollars", () => {
		expect(formatters.cents(25_000)).toBe("$250.00");
		expect(formatters.cents(-150)).toBe("-$1.50");
	});

	it("pads hour-index and clock labels", () => {
		expect(formatters.hourTick(0)).toBe("T+0000");
		expect(formatters.hourTick(24)).toBe("T+0024");
		expect(formatters.clockLabel(0)).toBe("D0 H00");
		expect(formatters.clockLabel(25)).toBe("D1 H01");
	});

	it("formats nullable parts-per-million", () => {
		expect(formatters.ppm(null)).toBe("—");
		expect(formatters.ppm(990_000)).toBe("990000 ppm");
	});
});

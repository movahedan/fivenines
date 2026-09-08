import { describe, expect, it } from "bun:test";

import { formatters } from "./formatters";

describe("formatters - display labels", () => {
	it("formats signed cents as dollars", () => {
		expect(formatters.cents(25_000)).toBe("$250.00");
		expect(formatters.cents(-150)).toBe("-$1.50");
	});

	it("pads hour-index and clock labels", () => {
		expect(formatters.hourTick(0)).toBe("TICK 0000");
		expect(formatters.hourTick(24)).toBe("TICK 0024");
		expect(formatters.clockLabel(0)).toBe("DAY 01 · HR 00:00");
		expect(formatters.clockLabel(25)).toBe("DAY 02 · HR 01:00");
	});

	it("formats nullable parts-per-million as a percent", () => {
		expect(formatters.ppm(null)).toBe("—");
		expect(formatters.ppm(990_000)).toBe("99.00%");
		expect(formatters.ppm(1_000_000)).toBe("100.00%");
	});

	it("formats compute counts as cores", () => {
		expect(formatters.cores(1)).toBe("1 core");
		expect(formatters.cores(1000)).toBe("1000 cores");
		expect(formatters.coresCompact(2000)).toBe("2000c");
	});
});

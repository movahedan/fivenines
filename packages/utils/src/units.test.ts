import { describe, expect, it } from "bun:test";

import { units } from "./units";

describe("units - integers", () => {
	it("returns the value when it is a finite integer", () => {
		expect(units.asFiniteInteger(3, "n")).toBe(3);
	});

	it("throws when the value is not a finite integer", () => {
		expect(() => units.asFiniteInteger(1.5, "n")).toThrow("n must be a finite integer");
		expect(() => units.asFiniteInteger(Number.NaN, "n")).toThrow("n must be a finite integer");
	});

	it("throws when the value is a negative integer", () => {
		expect(() => units.asNonNegativeInteger(-1, "n")).toThrow("n must be a non-negative integer");
	});
});

describe("units - ratios", () => {
	it("returns a floored percent when the denominator is positive", () => {
		expect(units.ratioPercent(1, 3)).toBe(33);
	});

	it("returns a floored parts-per-million when the denominator is positive", () => {
		expect(units.partsPerMillion(1, 3)).toBe(333333);
	});

	it("returns 0 when the denominator is 0", () => {
		expect(units.ratioPercent(1, 0)).toBe(0);
		expect(units.partsPerMillion(1, 0)).toBe(0);
	});
});

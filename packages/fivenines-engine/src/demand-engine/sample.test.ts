import { describe, expect, it } from "bun:test";

import { SeededRandomSource } from "./rng";
import { sampleGammaPoisson } from "./sample";

describe("sampleGammaPoisson - arrival sample", () => {
	it("keeps n=10000 mean within 5% of 300 for k=25", () => {
		const sampleSize = 10_000;
		const expectedMean = 300;
		const random = new SeededRandomSource(20260911);
		let sum = 0;

		for (let index = 0; index < sampleSize; index += 1) {
			sum += sampleGammaPoisson(expectedMean, 25, random);
		}

		const observed = sum / sampleSize;
		const tolerance = 0.05 * expectedMean;

		expect(
			Math.abs(observed - expectedMean) <= tolerance,
			`n=${String(sampleSize)} hours, mean ${String(observed)} vs ${String(expectedMean)} ±5%`,
		).toBe(true);
	});
});

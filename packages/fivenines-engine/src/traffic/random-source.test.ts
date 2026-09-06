import { describe, expect, it } from "bun:test";

import { FixedRandomSource, SequenceRandomSource } from "./random-source";

describe("SequenceRandomSource - nextUnit", () => {
	it("returns queued values then throws random sequence exhausted", () => {
		const random = new SequenceRandomSource([0.1, 0.2]);

		expect(random.nextUnit()).toBe(0.1);
		expect(random.nextUnit()).toBe(0.2);
		expect(() => random.nextUnit()).toThrow("random sequence exhausted");
	});
});

describe("FixedRandomSource - nextUnit", () => {
	it("returns the same unit on every call", () => {
		const random = new FixedRandomSource(0.5);

		expect(random.nextUnit()).toBe(0.5);
		expect(random.nextUnit()).toBe(0.5);
	});
});

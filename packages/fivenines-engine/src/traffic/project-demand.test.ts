import { describe, expect, it } from "bun:test";

import { ConstantDemand, ProjectDemand, type ProjectDemandTraits } from "./project-demand";
import { FixedRandomSource, SequenceRandomSource } from "./random-source";

const idleRandom = new FixedRandomSource(0.5);

function shoppingTraits(overrides: Partial<ProjectDemandTraits> = {}): ProjectDemandTraits {
	return {
		baseline: 1000,
		category: "shopping",
		region: "utc+0",
		campaignProne: false,
		...overrides,
	};
}

describe("ConstantDemand - demandFor", () => {
	it("returns the baseline for any hourIndex", () => {
		expect(new ConstantDemand(700).demandFor(99, idleRandom)).toBe(700);
	});
});

describe("ProjectDemand - category rhythm", () => {
	it("emits higher shopping demand at hour 20 than hour 4", () => {
		const demand = new ProjectDemand(shoppingTraits());

		expect(demand.demandFor(20, idleRandom)).toBeGreaterThan(demand.demandFor(4, idleRandom));
	});

	it("emits higher saas demand at hour 10 than hour 3", () => {
		const demand = new ProjectDemand({
			baseline: 1000,
			category: "saas",
			region: "utc+0",
			campaignProne: false,
		});

		expect(demand.demandFor(10, idleRandom)).toBeGreaterThan(demand.demandFor(3, idleRandom));
	});
});

describe("ProjectDemand - campaign window", () => {
	it("emits higher shopping demand at campaign hour 10 than hour 9", () => {
		const demand = new ProjectDemand(
			shoppingTraits({ campaign: { startHour: 10, durationHours: 2 } }),
		);

		expect(demand.demandFor(10, idleRandom)).toBeGreaterThan(demand.demandFor(9, idleRandom));
	});
});

describe("ProjectDemand - fat spike", () => {
	it("stays above idle through hour 47 after a fat trigger then drops at hour 48", () => {
		const spiked = new ProjectDemand(shoppingTraits());
		const idle = new ProjectDemand(shoppingTraits());
		const random = new SequenceRandomSource([0, ...Array.from({ length: 80 }, () => 0.5)]);

		expect(spiked.demandFor(0, random)).toBeGreaterThan(idle.demandFor(0, idleRandom));

		let hour47 = 0;

		for (let hourIndex = 1; hourIndex <= 47; hourIndex += 1) {
			const value = spiked.demandFor(hourIndex, random);

			expect(value).toBeGreaterThan(idle.demandFor(hourIndex, idleRandom));

			hour47 = value;
		}

		expect(spiked.demandFor(48, random)).toBeLessThan(hour47);
	});
});

describe("ProjectDemand - region", () => {
	it("emits higher shopping demand at evening hourIndex for utc+0 than utc-5", () => {
		const utc = new ProjectDemand(shoppingTraits({ region: "utc+0" }));
		const shifted = new ProjectDemand(shoppingTraits({ region: "utc-5" }));

		expect(utc.demandFor(20, idleRandom)).toBeGreaterThan(shifted.demandFor(20, idleRandom));
	});
});

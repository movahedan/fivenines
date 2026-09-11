import { describe, expect, it } from "bun:test";

import { OCCUPANCY_DIMENSIONS, THROUGHPUT_DIMENSIONS, WORK_UNITS } from "./units";

describe("work - units", () => {
	it("names throughput per tick separately from retained occupancy", () => {
		expect(THROUGHPUT_DIMENSIONS).toEqual(["cpuWork", "gpuWork", "diskOps", "networkMiB"]);
		expect(OCCUPANCY_DIMENSIONS).toEqual([
			"residentMemoryMiB",
			"queuedMemoryMiB",
			"diskCapacityMiB",
		]);
		expect(WORK_UNITS.cpuWork).toContain("/ tick");
		expect(WORK_UNITS.residentMemoryMiB).toBe("resident MiB");
	});
});

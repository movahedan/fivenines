import { describe, expect, it } from "bun:test";

import { PLACEMENT_POLICY } from "./placement-policy";

describe("PLACEMENT_POLICY - v1 tables", () => {
	it("uses 5 ms of extra latency per hour of region offset", () => {
		expect(PLACEMENT_POLICY.latencyMsPerOffsetHour).toBe(5);
	});
});

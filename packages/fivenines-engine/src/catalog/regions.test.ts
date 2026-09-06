import { describe, expect, it } from "bun:test";

import { PLACEMENT_POLICY } from "./placement-policy";
import { regions } from "./regions";

describe("regions - remoteLatencyMs", () => {
	it("returns offset-hour delta times PLACEMENT_POLICY.latencyMsPerOffsetHour", () => {
		expect(regions.remoteLatencyMs("utc+0", "utc+0")).toBe(0);
		expect(regions.remoteLatencyMs("utc-5", "utc+0")).toBe(
			5 * PLACEMENT_POLICY.latencyMsPerOffsetHour,
		);
		expect(regions.remoteLatencyMs("utc+9", "utc+0")).toBe(
			9 * PLACEMENT_POLICY.latencyMsPerOffsetHour,
		);
	});
});

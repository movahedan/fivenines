import { describe, expect, it } from "bun:test";

import { PLACEMENT_POLICY } from "./placement-policy";
import { DEFAULT_REGION, REGION_IDS, regions } from "./regions";

describe("regions - catalog", () => {
	it("exposes every byId key and defaults buy/lab placement to utc+0", () => {
		expect(REGION_IDS).toEqual(["utc-8", "utc-5", "utc+0", "utc+1", "utc+9"]);
		expect(DEFAULT_REGION).toBe("utc+0");
	});
});

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

import { describe, expect, it } from "bun:test";

import { TRAFFIC_POLICY } from "./traffic-policy";

describe("TRAFFIC_POLICY - v1 tables", () => {
	it("uses shopping evening permille 1400 and saas night permille 200", () => {
		expect(TRAFFIC_POLICY.rhythm.shopping).toContainEqual({
			startHour: 17,
			endHour: 22,
			permille: 1400,
		});
		expect(TRAFFIC_POLICY.rhythm.saas).toContainEqual({
			startHour: 0,
			endHour: 7,
			permille: 200,
		});
	});
});

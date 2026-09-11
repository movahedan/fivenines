import { describe, expect, it } from "bun:test";

import { ACQUAINTANCE_TRUST, setupPatienceMilliHours } from "./contract-policy";

describe("setupPatienceMilliHours", () => {
	it("gives the first acquaintance 14.4h after allowance", () => {
		expect(setupPatienceMilliHours(ACQUAINTANCE_TRUST, 0, 0)).toBe(14_400);
	});

	it("clamps to 4.5h at the low end", () => {
		expect(setupPatienceMilliHours(0, 0, 100)).toBe(4_500);
	});
});

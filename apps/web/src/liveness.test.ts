import { describe, expect, it } from "bun:test";

import { acceptIncludesJson, isLivenessPath, processStatusBody } from "./liveness";

describe("processStatusBody - process up", () => {
	it("returns ok and an ISO timestamp", () => {
		const body = processStatusBody();

		expect(body.ok).toBe(true);
		expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
	});
});

describe("isLivenessPath - probe URLs", () => {
	it("treats home and status as liveness", () => {
		expect(isLivenessPath("/")).toBe(true);
		expect(isLivenessPath("/status")).toBe(true);
		expect(isLivenessPath("/hub")).toBe(false);
	});
});

describe("acceptIncludesJson - negotiate JSON", () => {
	it("is true when Accept lists application/json", () => {
		expect(acceptIncludesJson("application/json")).toBe(true);
		expect(acceptIncludesJson("text/html")).toBe(false);
		expect(acceptIncludesJson(undefined)).toBe(false);
	});
});

import { describe, expect, it } from "bun:test";

import { isLivenessPath, processStatusBody } from "./liveness";

describe("processStatusBody - process up", () => {
	it("returns ok and an ISO timestamp", () => {
		const body = processStatusBody();

		expect(body.ok).toBe(true);
		expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
	});
});

describe("isLivenessPath - probe URLs", () => {
	it("treats only status as liveness", () => {
		expect(isLivenessPath("/")).toBe(false);
		expect(isLivenessPath("/status")).toBe(true);
		expect(isLivenessPath("/hub")).toBe(false);
	});
});

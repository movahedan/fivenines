import { describe, expect, it } from "bun:test";

import { handleStatus, processStatusBody } from "../status";

describe("GET /status - liveness JSON", () => {
	it("returns ok and an ISO timestamp from processStatusBody", () => {
		const body = processStatusBody();

		expect(body.ok).toBe(true);
		expect(typeof body.timestamp).toBe("string");
	});

	it("returns JSON Response with ok true when handleStatus is called", async () => {
		const response = handleStatus();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");

		const body = (await response.json()) as { ok: boolean; timestamp: string };
		expect(body.ok).toBe(true);
		expect(typeof body.timestamp).toBe("string");
	});
});

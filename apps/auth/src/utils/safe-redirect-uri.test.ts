import { describe, expect, it } from "bun:test";

import { safeRedirectUri } from "./safe-redirect-uri";

const origins = ["http://localhost:3000", "http://127.0.0.1:3000"] as const;

describe("safeRedirectUri - origin allowlist", () => {
	it("accepts an allowlisted player callback", () => {
		expect(safeRedirectUri("http://localhost:3000/callback", origins)).toBe(
			"http://localhost:3000/callback",
		);
	});

	it("rejects an origin that is not allowlisted", () => {
		expect(safeRedirectUri("https://evil.example/callback", origins)).toBeNull();
	});

	it("rejects relative paths and javascript URLs", () => {
		expect(safeRedirectUri("/callback", origins)).toBeNull();
		expect(safeRedirectUri("javascript:alert(1)", origins)).toBeNull();
	});
});

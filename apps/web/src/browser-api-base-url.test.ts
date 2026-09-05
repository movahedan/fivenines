import { describe, expect, it } from "bun:test";

import { getBrowserApiBaseUrl } from "./browser-api-base-url";

describe("getBrowserApiBaseUrl - env fallback", () => {
	it("returns api.fivenines.com when VITE_NESTJS_API_URL is unset", () => {
		expect(getBrowserApiBaseUrl()).toBe("http://api.fivenines.com:3006");
	});
});

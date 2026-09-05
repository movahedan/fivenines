import { describe, expect, it } from "bun:test";

import { getBrowserApiBaseUrl } from "./browser-api-base-url";

describe("getBrowserApiBaseUrl - env fallback", () => {
	it("returns api.fivenines.test when VITE_NESTJS_API_URL is unset", () => {
		expect(getBrowserApiBaseUrl()).toBe("http://api.fivenines.test:3006");
	});
});

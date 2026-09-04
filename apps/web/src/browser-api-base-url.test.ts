import { describe, expect, it } from "bun:test";

import { getBrowserApiBaseUrl } from "./browser-api-base-url";

describe("getBrowserApiBaseUrl - env fallback", () => {
	it("returns localhost nest when VITE_NESTJS_API_URL is unset", () => {
		expect(getBrowserApiBaseUrl()).toBe("http://localhost:3006");
	});
});

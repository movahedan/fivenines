import { afterEach, describe, expect, it } from "bun:test";

import { getBrowserApiBaseUrl } from "./browser-api-base-url";

describe("getBrowserApiBaseUrl - env fallback", () => {
	const env = import.meta.env as { VITE_NESTJS_API_URL?: string };
	const previous = env.VITE_NESTJS_API_URL;

	afterEach(() => {
		env.VITE_NESTJS_API_URL = previous;
	});

	it("returns api.fivenines.com when VITE_NESTJS_API_URL is unset", () => {
		env.VITE_NESTJS_API_URL = undefined;

		expect(getBrowserApiBaseUrl()).toBe("http://api.fivenines.com:3002");
	});
});

import { describe, expect, it } from "bun:test";

import { hasWasLoggedInCookie, WAS_LOGGED_IN_COOKIE } from "./was-logged-in";

describe("hasWasLoggedInCookie - public hint", () => {
	it("is false when the cookie is missing", () => {
		expect(hasWasLoggedInCookie()).toBe(false);
	});

	it("is true when the named cookie is present", () => {
		Object.defineProperty(document, "cookie", {
			configurable: true,
			get: () => `${WAS_LOGGED_IN_COOKIE}=1`,
		});

		expect(hasWasLoggedInCookie()).toBe(true);

		Reflect.deleteProperty(document, "cookie");
	});
});

import { describe, expect, it } from "bun:test";

import { authNavHref } from "./auth-nav-href";

describe("authNavHref - keep login return on auth pages", () => {
	it("copies redirect_uri and state onto the target path", () => {
		expect(
			authNavHref("/register", {
				redirectUri: "http://play.fivenines.com:3000/hub",
				state: "/hub",
			}),
		).toBe("/register?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub&state=%2Fhub");
	});

	it("copies next when there is no redirect_uri", () => {
		expect(authNavHref("/otp", { next: "/login" })).toBe("/otp?next=%2Flogin");
	});

	it("returns the path alone when no return is set", () => {
		expect(authNavHref("/login", {})).toBe("/login");
	});
});

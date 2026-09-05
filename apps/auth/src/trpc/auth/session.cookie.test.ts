import { describe, expect, it } from "bun:test";

import { authConfig } from "../../config";
import {
	accessCookieHeader,
	loggedInCookieHeader,
	refreshCookieHeader,
	sessionCookieHeader,
} from "./session";

describe("auth cookies - shared Domain and SameSite=Strict", () => {
	it("sets HttpOnly session cookie with Domain", () => {
		const header = sessionCookieHeader("sess-id", 3600);

		expect(header).toContain(`${authConfig.cookieSession}=sess-id`);
		expect(header).toContain("HttpOnly");
		expect(header).toContain("SameSite=Strict");
		expect(header).toContain(`Domain=${authConfig.cookieDomain}`);
	});

	it("sets a public was-logged-in cookie without HttpOnly", () => {
		const header = loggedInCookieHeader(3600);

		expect(header).toContain(`${authConfig.cookieLoggedIn}=1`);
		expect(header).not.toContain("HttpOnly");
		expect(header).toContain("SameSite=Strict");
	});

	it("sets an HttpOnly access JWT cookie", () => {
		const header = accessCookieHeader("header.payload.sig", 900);

		expect(header).toContain(`${authConfig.cookieAccess}=`);
		expect(header).toContain("HttpOnly");
		expect(refreshCookieHeader("refresh", 3600)).toContain("HttpOnly");
	});
});

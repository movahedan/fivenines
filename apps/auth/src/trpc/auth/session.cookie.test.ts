import { describe, expect, it } from "bun:test";

import { authConfig } from "../../config";
import { appendAuthCookie, authCookieFlags } from "./session";

function firstSetCookie(headers: Headers): string {
	return headers.getSetCookie()[0] ?? "";
}

describe("auth cookies - shared Domain and SameSite=Strict", () => {
	it("sets HttpOnly session cookie with Domain", () => {
		const headers = appendAuthCookie(
			new Headers(),
			authConfig.cookieSession,
			"sess-id",
			authCookieFlags(3600, true),
		);
		const header = firstSetCookie(headers);

		expect(header).toContain(`${authConfig.cookieSession}=sess-id`);
		expect(header).toContain("HttpOnly");
		expect(header).toContain("SameSite=Strict");
		expect(header).toContain(`Domain=${authConfig.cookieDomain}`);
	});

	it("sets a public was-logged-in cookie without HttpOnly", () => {
		const headers = appendAuthCookie(
			new Headers(),
			authConfig.cookieLoggedIn,
			"1",
			authCookieFlags(3600, false),
		);
		const header = firstSetCookie(headers);

		expect(header).toContain(`${authConfig.cookieLoggedIn}=1`);
		expect(header).not.toContain("HttpOnly");
		expect(header).toContain("SameSite=Strict");
	});

	it("sets an HttpOnly access JWT cookie", () => {
		const access = firstSetCookie(
			appendAuthCookie(
				new Headers(),
				authConfig.cookieAccess,
				"header.payload.sig",
				authCookieFlags(900, true),
			),
		);
		const refresh = firstSetCookie(
			appendAuthCookie(
				new Headers(),
				authConfig.cookieRefresh,
				"refresh",
				authCookieFlags(3600, true),
			),
		);

		expect(access).toContain(`${authConfig.cookieAccess}=`);
		expect(access).toContain("HttpOnly");
		expect(refresh).toContain("HttpOnly");
	});
});

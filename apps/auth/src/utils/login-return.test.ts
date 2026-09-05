import { describe, expect, it } from "bun:test";

import { loginReturnFromRequest } from "./login-return";

describe("loginReturnFromRequest - Discord-style redirect", () => {
	it("uses an allowlisted redirect_uri over next", () => {
		const req = new Request(
			"http://auth.fivenines.test:3007/login?redirect_uri=http%3A%2F%2Fplay.fivenines.test%3A3001%2Fhub&state=%2Fhub&next=%2Fother",
		);

		expect(loginReturnFromRequest(req)).toEqual({
			kind: "external",
			redirectUri: "http://play.fivenines.test:3001/hub",
			state: "/hub",
		});
	});

	it("falls back to a relative next when redirect_uri is absent", () => {
		const req = new Request("http://localhost:3007/login?next=/hub");

		expect(loginReturnFromRequest(req)).toEqual({ kind: "relative", path: "/hub" });
	});
});

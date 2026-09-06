import { describe, expect, it } from "bun:test";

import { loginReturnFromRequest, loginReturnLocation } from "./login-return";

const playOrigin = "http://play.fivenines.com:3000";

describe("loginReturnFromRequest - Discord-style redirect", () => {
	it("uses an allowlisted redirect_uri over next", () => {
		const req = new Request(
			"http://auth.fivenines.com:3001/login?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub&state=%2Fhub&next=%2Fother",
		);

		expect(loginReturnFromRequest(req, undefined, [playOrigin])).toEqual({
			kind: "external",
			redirectUri: "http://play.fivenines.com:3000/hub",
			state: "/hub",
		});
	});

	it("falls back to a relative next when redirect_uri is absent", () => {
		const req = new Request("http://localhost:3001/login?next=/hub");

		expect(loginReturnFromRequest(req, undefined, [playOrigin])).toEqual({
			kind: "relative",
			path: "/hub",
		});
	});

	it("returns the allowlisted URI or relative path for Location", () => {
		const external = loginReturnFromRequest(
			new Request(
				"http://auth.fivenines.com:3001/login?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub",
			),
			undefined,
			[playOrigin],
		);
		const relative = loginReturnFromRequest(
			new Request("http://localhost:3001/login?next=/hub"),
			undefined,
			[playOrigin],
		);

		expect(loginReturnLocation(external)).toBe("http://play.fivenines.com:3000/hub");
		expect(loginReturnLocation(relative)).toBe("/hub");
	});
});

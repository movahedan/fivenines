import { describe, expect, it } from "bun:test";

import { loginHref, redirectState } from "./login-href";

describe("loginHref - configured origins", () => {
	it("builds login URL and state from a relative redirectUri", () => {
		expect(
			loginHref({
				authOrigin: "http://auth.fivenines.com:3001",
				appOrigin: "http://play.fivenines.com:3000",
				redirectUri: "/hub",
			}),
		).toBe(
			"http://auth.fivenines.com:3001/login?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub&state=%2Fhub",
		);
	});
});

describe("redirectState - path from redirectUri", () => {
	it("keeps a relative path as state", () => {
		expect(redirectState("/hub")).toBe("/hub");
	});

	it("uses pathname of an absolute redirect URI", () => {
		expect(redirectState("http://play.fivenines.com:3000/hub")).toBe("/hub");
	});
});

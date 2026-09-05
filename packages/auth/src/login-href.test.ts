import { describe, expect, it } from "bun:test";

import { loginHref } from "./login-href";

describe("loginHref - auth origin", () => {
	it("sets redirect_uri and state on the auth login URL", () => {
		expect(
			loginHref({
				authOrigin: "http://localhost:3007",
				redirectUri: "http://localhost:3001/callback",
				state: "/hub",
			}),
		).toBe(
			"http://localhost:3007/login?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&state=%2Fhub",
		);
	});
});

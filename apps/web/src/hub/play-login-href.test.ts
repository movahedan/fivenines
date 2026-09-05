import { describe, expect, it } from "bun:test";

import { playLoginHref } from "./play-login-href";

describe("playLoginHref - auth hop", () => {
	it("points at auth login with hub as return state", () => {
		const href = playLoginHref();

		expect(href).toContain("/login?");
		expect(href).toContain("state=%2Fhub");
	});
});

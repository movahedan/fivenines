import { describe, expect, it } from "bun:test";

import { playReturnOrigin } from "./play-return-origin";

describe("playReturnOrigin - post-login host", () => {
	it("returns the page origin when the browser is not on auth", () => {
		expect(
			playReturnOrigin(
				"http://auth.fivenines.com:3001",
				"http://play.fivenines.com:3000",
				"http://localhost:3000",
			),
		).toBe("http://localhost:3000");
	});

	it("uses the configured play origin when the page is the auth origin", () => {
		expect(
			playReturnOrigin(
				"http://auth.fivenines.com:3001",
				"http://play.fivenines.com:3000",
				"http://auth.fivenines.com:3001",
			),
		).toBe("http://play.fivenines.com:3000");
	});

	it("uses the configured play origin when there is no page origin", () => {
		expect(
			playReturnOrigin(
				"http://auth.fivenines.com:3001",
				"http://play.fivenines.com:3000",
				undefined,
			),
		).toBe("http://play.fivenines.com:3000");
	});
});

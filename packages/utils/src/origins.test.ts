import { describe, expect, it } from "bun:test";

import { getAppOrigin, getAuthOrigin } from "./origins";

describe("getAuthOrigin - env URL", () => {
	it("returns the default when the value is missing", () => {
		expect(getAuthOrigin()).toBe("http://auth.fivenines.com:3007");
		expect(getAuthOrigin("")).toBe("http://auth.fivenines.com:3007");
	});

	it("strips a trailing slash from a valid origin", () => {
		expect(getAuthOrigin("http://auth.fivenines.com:3007/")).toBe("http://auth.fivenines.com:3007");
	});
});

describe("getAppOrigin - env then window", () => {
	it("uses a valid env origin before window", () => {
		expect(getAppOrigin("http://localhost:3001/")).toBe("http://localhost:3001");
	});

	it("rejects a non-http value", () => {
		expect(getAppOrigin("not-a-url")).not.toBe("not-a-url");
	});
});

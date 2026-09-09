import { describe, expect, it } from "bun:test";

import { prerenderPathToDistRelative, WEB_PRERENDER_PATHS } from "./web-prerender-paths";

describe("web prerender paths", () => {
	it("maps trailingSlash never paths to nested index.html", () => {
		expect(prerenderPathToDistRelative("/")).toBe("index.html");
		expect(prerenderPathToDistRelative("/about")).toBe("about/index.html");
		expect(prerenderPathToDistRelative("/cookie-policy")).toBe("cookie-policy/index.html");
	});

	it("lists every marketing URL once", () => {
		expect([...WEB_PRERENDER_PATHS]).toEqual([
			"/",
			"/about",
			"/privacy",
			"/terms",
			"/cookie-policy",
			"/contact",
		]);
	});
});

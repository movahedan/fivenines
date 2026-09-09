import { describe, expect, it } from "bun:test";

import { pageHead } from "./-page-head";

describe("pageHead", () => {
	it("sets title, description, and absolute og tags", () => {
		const { meta } = pageHead({
			title: "About · Five Nines",
			description: "Studio notes",
			path: "/about",
		});

		expect(meta).toContainEqual({ title: "About · Five Nines" });
		expect(meta).toContainEqual({ name: "description", content: "Studio notes" });
		expect(meta).toContainEqual({
			property: "og:image",
			content: "http://play.fivenines.com:3000/og.svg",
		});
		expect(meta).toContainEqual({
			property: "og:url",
			content: "http://play.fivenines.com:3000/about",
		});
	});
});

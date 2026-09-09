import { describe, expect, it } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { LoginPage } from "./login";

describe("auth document shell", () => {
	it("uses ops console colors on the sign-in page", () => {
		const html = renderToStaticMarkup(
			<LoginPage csrfToken="test-csrf" email="player@example.com" />,
		);

		expect(html).toContain("--primary: #00ff88");
		expect(html).toContain("--background: #050912");
		expect(html).toContain("Five Nines");
		expect(html).toContain("Sign in");
	});

	it("keeps redirect_uri on brand and sibling auth links", () => {
		const html = renderToStaticMarkup(
			<LoginPage
				csrfToken="test-csrf"
				redirectUri="http://play.fivenines.com:3000/hub"
				state="/hub"
			/>,
		);

		expect(html).toContain(
			'href="/login?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub&amp;state=%2Fhub"',
		);
		expect(html).toContain(
			'href="/register?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub&amp;state=%2Fhub"',
		);
		expect(html).toContain(
			'href="/otp?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub&amp;state=%2Fhub"',
		);
	});
});

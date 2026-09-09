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
});

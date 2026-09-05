import { afterEach, describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { AuthProvider, useAuth } from "./auth-provider";

function stubLoggedInHint(present: boolean): void {
	Object.defineProperty(document, "cookie", {
		configurable: true,
		get: () => (present ? "was_logged_in=1" : ""),
		set: () => undefined,
	});
}

function Probe(): ReactElement {
	const { loginHref, wasLoggedIn } = useAuth();
	return (
		<div>
			<a href={loginHref({ redirectUri: "/hub" })}>Sign in</a>
			<span>{wasLoggedIn ? "hint" : "no-hint"}</span>
		</div>
	);
}

describe("AuthProvider - consumer tools", () => {
	afterEach(() => {
		Reflect.deleteProperty(document, "cookie");
	});

	it("exposes loginHref that uses provider origins and derives state", () => {
		stubLoggedInHint(false);
		render(
			<AuthProvider
				restoreOnMount={false}
				authOrigin="http://auth.fivenines.com:3007"
				appOrigin="http://play.fivenines.com:3001"
			>
				<Probe />
			</AuthProvider>,
		);

		expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe(
			"http://auth.fivenines.com:3007/login?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3001%2Fhub&state=%2Fhub",
		);
		expect(screen.getByText("no-hint")).toBeTruthy();
	});

	it("exposes wasLoggedIn from the public hint cookie", () => {
		stubLoggedInHint(true);
		render(
			<AuthProvider
				restoreOnMount={false}
				authOrigin="http://auth.fivenines.com:3007"
				appOrigin="http://play.fivenines.com:3001"
			>
				<Probe />
			</AuthProvider>,
		);

		expect(screen.getByText("hint")).toBeTruthy();
	});
});

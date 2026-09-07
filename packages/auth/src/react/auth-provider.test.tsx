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
	const { loginHref, logoutHref, wasLoggedIn } = useAuth();
	return (
		<div>
			<a href={loginHref({ redirectUri: "/hub" })}>Sign in</a>
			<a href={logoutHref({ redirectUri: "/" })}>Sign out</a>
			<span>{wasLoggedIn ? "hint" : "no-hint"}</span>
		</div>
	);
}

describe("AuthProvider - consumer tools", () => {
	afterEach(() => {
		Reflect.deleteProperty(document, "cookie");
	});

	it("exposes loginHref and logoutHref that use provider origins and derive state", () => {
		stubLoggedInHint(false);
		render(
			<AuthProvider
				restoreOnMount={false}
				authOrigin="http://auth.fivenines.com:3001"
				appOrigin="http://play.fivenines.com:3000"
			>
				<Probe />
			</AuthProvider>,
		);

		expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe(
			"http://auth.fivenines.com:3001/login?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub&state=%2Fhub",
		);
		expect(screen.getByRole("link", { name: "Sign out" }).getAttribute("href")).toBe(
			"http://auth.fivenines.com:3001/logout?redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2F&state=%2F",
		);
		expect(screen.getByText("no-hint")).toBeTruthy();
	});

	it("exposes wasLoggedIn from the public hint cookie", () => {
		stubLoggedInHint(true);
		render(
			<AuthProvider
				restoreOnMount={false}
				authOrigin="http://auth.fivenines.com:3001"
				appOrigin="http://play.fivenines.com:3000"
			>
				<Probe />
			</AuthProvider>,
		);

		expect(screen.getByText("hint")).toBeTruthy();
	});
});

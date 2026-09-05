import { afterEach, describe, expect, it, mock } from "bun:test";

import { render, screen, waitFor } from "@testing-library/react";

import { AuthProvider } from "@packages/auth/react";

import { HubPage, PlayButton } from "./hub";

function stubLoggedInHint(present: boolean): void {
	Object.defineProperty(document, "cookie", {
		configurable: true,
		get: () => (present ? "was_logged_in=1" : ""),
		set: () => undefined,
	});
}

function renderHub(): ReturnType<typeof render> {
	return render(
		<AuthProvider
			restoreOnMount={false}
			authOrigin="http://auth.fivenines.com:3007"
			appOrigin="http://play.fivenines.com:3001"
		>
			<HubPage />
		</AuthProvider>,
	);
}

describe("HubPage - session gate", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("sends the browser to auth login when the public hint cookie is missing", async () => {
		stubLoggedInHint(false);
		const assign = mock(() => undefined);
		window.location.assign = assign as typeof window.location.assign;

		renderHub();

		await waitFor(() => {
			expect(assign).toHaveBeenCalled();
		});
		const calls = assign.mock.calls as unknown as ReadonlyArray<ReadonlyArray<unknown>>;
		expect(String(calls[0]?.[0] ?? "")).toContain("/login?");
		expect(String(calls[0]?.[0] ?? "")).toContain("state=%2Fhub");
	});

	it("shows the hub when the public hint cookie is set", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitFor(() => {
			expect(screen.getByRole("heading", { name: "Hub" })).toBeTruthy();
		});
	});
});

describe("PlayButton - hub entry", () => {
	it("always links to the guarded hub", () => {
		render(<PlayButton />);

		expect(screen.getByRole("link", { name: "Play" }).getAttribute("href")).toBe("/hub");
	});
});

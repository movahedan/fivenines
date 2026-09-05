import { afterEach, describe, expect, it, mock } from "bun:test";

import { render, screen, waitFor } from "@testing-library/react";

import { HubPage } from "./hub";

function stubLoggedInHint(present: boolean): void {
	Object.defineProperty(document, "cookie", {
		configurable: true,
		get: () => (present ? "was_logged_in=1" : ""),
		set: () => undefined,
	});
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

		render(<HubPage />);

		await waitFor(() => {
			expect(assign).toHaveBeenCalled();
		});
		const calls = assign.mock.calls as unknown as ReadonlyArray<ReadonlyArray<unknown>>;
		expect(String(calls[0]?.[0] ?? "")).toContain("/login?");
	});

	it("shows the hub when the public hint cookie is set", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		render(<HubPage />);

		await waitFor(() => {
			expect(screen.getByRole("heading", { name: "Hub" })).toBeTruthy();
		});
	});
});

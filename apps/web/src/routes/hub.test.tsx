import { afterEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
			authOrigin="http://auth.fivenines.com:3001"
			appOrigin="http://play.fivenines.com:3000"
		>
			<HubPage />
		</AuthProvider>,
	);
}

async function waitForOpsFloor(): Promise<void> {
	await waitFor(() => {
		expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
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

		renderHub();

		await waitFor(() => {
			expect(assign).toHaveBeenCalled();
		});
		const calls = assign.mock.calls as unknown as ReadonlyArray<ReadonlyArray<unknown>>;
		expect(String(calls[0]?.[0] ?? "")).toContain("/login?");
		expect(String(calls[0]?.[0] ?? "")).toContain("state=%2Fhub");
	});

	it("shows the ops floor when the public hint cookie is set", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		expect(screen.getByRole("region", { name: "Incoming queue" })).toBeTruthy();
		expect(screen.getByRole("region", { name: "Server market" })).toBeTruthy();
		expect(screen.getByText("Incoming (10)")).toBeTruthy();
		expect(screen.getByText("Fleet (0)")).toBeTruthy();
	});
});

describe("HubPage - ops landmarks", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("toggles pause without changing the incoming queue count", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		fireEvent.click(screen.getByRole("button", { name: "Pause" }));
		expect(screen.getByRole("button", { name: "Resume" })).toBeTruthy();
		expect(screen.getByText("Incoming (10)")).toBeTruthy();
	});

	it("moves a bought Bronze into the fleet panel", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		const buyBronze = screen.getAllByRole("button", { name: "BUY" })[0];
		if (buyBronze === undefined) {
			throw new Error("expected a market BUY button");
		}
		fireEvent.click(buyBronze);

		await waitFor(() => {
			expect(screen.getByText("Fleet (1)")).toBeTruthy();
		});
	});

	it("moves an accepted offer into the active panel", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		const accept = screen.getAllByRole("button", { name: "ACCEPT" })[0];
		if (accept === undefined) {
			throw new Error("expected an offer ACCEPT button");
		}
		fireEvent.click(accept);

		await waitFor(() => {
			expect(screen.getByText("Active (1)")).toBeTruthy();
			expect(screen.getByText("Incoming (9)")).toBeTruthy();
		});
	});
});

describe("PlayButton - hub entry", () => {
	it("always links to the guarded hub", () => {
		render(<PlayButton />);

		expect(screen.getByRole("link", { name: "Play" }).getAttribute("href")).toBe("/hub");
	});
});

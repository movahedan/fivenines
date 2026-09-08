import { afterEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

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

function stubSession(): void {
	stubLoggedInHint(true);
	globalThis.fetch = mock(async () =>
		Promise.resolve(new Response(null, { status: 401 })),
	) as unknown as typeof fetch;
}

function activeFloor(): HTMLElement {
	return screen.getByRole("region", { name: "Active floor" });
}

function buyFirstMarketServer(): void {
	const buy = screen.getAllByRole("button", { name: "BUY" })[0];

	if (buy === undefined) {
		throw new Error("expected a market BUY button");
	}

	fireEvent.click(buy);
}

function acceptFirstOffer(): void {
	const accept = screen.getAllByRole("button", { name: "ACCEPT" })[0];

	if (accept === undefined) {
		throw new Error("expected an offer ACCEPT button");
	}

	fireEvent.click(accept);
}

async function serveFirstOffer(): Promise<void> {
	buyFirstMarketServer();

	await waitFor(() => {
		expect(screen.getByText("Fleet (1)")).toBeTruthy();
	});

	acceptFirstOffer();

	await waitFor(() => {
		expect(screen.getByText("Active (1)")).toBeTruthy();
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
		expect(screen.getByRole("region", { name: "Event log" }).className).toContain(
			"overflow-hidden",
		);
	});
});

describe("HubPage - ops landmarks", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("sends the browser to auth logout with home as redirect_uri", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		const assign = mock(() => undefined);
		window.location.assign = assign as typeof window.location.assign;

		fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

		expect(assign).toHaveBeenCalled();
		const href = String(
			(assign.mock.calls as unknown as ReadonlyArray<ReadonlyArray<unknown>>)[0]?.[0] ?? "",
		);
		expect(href).toContain("/logout?");
		expect(href).toContain("redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2F");
		expect(href).not.toContain("/login?");
	});

	it("toggles pause without changing the incoming queue count", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		fireEvent.click(screen.getByRole("button", { name: "Pause" }));
		expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
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
		expect(screen.getByLabelText("CPU 0 percent")).toBeTruthy();
		expect(screen.getByLabelText("NET 0 percent")).toBeTruthy();
		expect(screen.getByLabelText("RAM 0 percent")).toBeTruthy();
	});

	it("moves an accepted offer into the active panel", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		buyFirstMarketServer();

		await waitFor(() => {
			expect(screen.getByText("Fleet (1)")).toBeTruthy();
		});
		acceptFirstOffer();

		await waitFor(() => {
			expect(screen.getByText("Active (1)")).toBeTruthy();
			expect(screen.getByText("Incoming (9)")).toBeTruthy();
		});
	});

	it("removes a declined offer from the incoming queue", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		expect(screen.getByText("Receivable today")).toBeTruthy();
		expect(screen.getByText("OPEX / hour")).toBeTruthy();
		const decline = screen.getAllByRole("button", { name: "DECLINE" })[0];
		if (decline === undefined) {
			throw new Error("expected an offer DECLINE button");
		}
		fireEvent.click(decline);

		await waitFor(() => {
			expect(screen.getByText("Incoming (9)")).toBeTruthy();
			expect(screen.getByText("Active (0)")).toBeTruthy();
		});
		expect(screen.queryByText(/not a kernel command/)).toBeNull();
	});
});

describe("HubPage - project routing", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("keeps Accept disabled while the fleet is empty", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();

		expect(screen.getAllByRole("button", { name: "ACCEPT" })[0]).toBeDisabled();
	});

	it("shows the routed server on the active card after accepting an offer", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		await serveFirstOffer();

		expect(within(activeFloor()).getByText("server-1 · Bronze")).toBeTruthy();
	});

	it("moves a served project into the parked list and back when parked then assigned", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		await serveFirstOffer();

		fireEvent.click(within(activeFloor()).getByRole("button", { name: "PARK" }));

		await waitFor(() => {
			expect(screen.getByText("Active (0)")).toBeTruthy();
			expect(screen.getByText("Parked (1)")).toBeTruthy();
		});
		expect(within(activeFloor()).getByText("PARKED")).toBeTruthy();

		fireEvent.click(within(activeFloor()).getByRole("button", { name: "ASSIGN" }));

		await waitFor(() => {
			expect(screen.getByText("Active (1)")).toBeTruthy();
			expect(screen.getByText("Parked (0)")).toBeTruthy();
		});
		expect(within(activeFloor()).getByText("server-1 · Bronze")).toBeTruthy();
	});

	it("does not log a move when MOVE is clicked with the picker still on the current server", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		await serveFirstOffer();

		fireEvent.click(within(activeFloor()).getByRole("button", { name: "MOVE" }));

		const log = screen.getByRole("region", { name: "Event log" });

		await waitFor(() => {
			expect(within(log).queryByText(/^Moved /)).toBeNull();
		});
		expect(within(activeFloor()).getByText("server-1 · Bronze")).toBeTruthy();
	});

	it("refuses to sell a server while a served project routes to it, then sells once parked", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		await serveFirstOffer();

		fireEvent.click(within(activeFloor()).getByRole("button", { name: "SELL" }));

		await waitFor(() => {
			expect(screen.getByRole("alert").textContent).toContain(
				"server has a served project routed to it: acme-web",
			);
		});
		expect(screen.getByText("Fleet (1)")).toBeTruthy();

		fireEvent.click(within(activeFloor()).getByRole("button", { name: "PARK" }));
		fireEvent.click(within(activeFloor()).getByRole("button", { name: "SELL" }));

		await waitFor(() => {
			expect(screen.getByText("Fleet (0)")).toBeTruthy();
		});
		expect(screen.queryByRole("alert")).toBeNull();
	});
});

describe("PlayButton - hub entry", () => {
	it("always links to the guarded hub", () => {
		render(<PlayButton />);

		expect(screen.getByRole("link", { name: "Play" }).getAttribute("href")).toBe("/hub");
	});
});

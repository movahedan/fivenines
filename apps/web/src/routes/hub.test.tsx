import { afterEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { AuthProvider } from "@packages/auth/react";

import { ActiveProjectCard } from "@/molecules/active-project-card/active-project-card";
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

function firstAcceptButton(): HTMLElement {
	const button = screen.getAllByRole("button", { name: "ACCEPT" })[0];

	if (button === undefined) {
		throw new Error("expected an ACCEPT button");
	}

	return button;
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
	fireEvent.click(screen.getByRole("button", { name: "Accept contract" }));
}

async function setupFirstOffer(): Promise<void> {
	acceptFirstOffer();

	await waitFor(() => {
		expect(screen.getByText("Active (1)")).toBeTruthy();
		expect(screen.getByText(/Assign a box, then install and configure/)).toBeTruthy();
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
		expect(String(calls[0]?.[0] ?? "")).toContain(
			"redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Fhub",
		);
	});

	it("shows the ops floor when the public hint cookie is set", async () => {
		stubLoggedInHint(true);
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		renderHub();

		await waitForOpsFloor();
		expect(screen.getByRole("region", { name: "Incoming queue" })).toBeTruthy();
		expect(screen.getByRole("region", { name: "Projects" })).toBeTruthy();
		expect(screen.getByRole("region", { name: "Business" })).toBeTruthy();
		expect(screen.getByRole("navigation", { name: "Workspace" })).toBeTruthy();
		expect(screen.getByRole("region", { name: "Server market" })).toBeTruthy();
		expect(screen.getByText("Incoming (1)")).toBeTruthy();
		expect(screen.getByText("Fleet (0)")).toBeTruthy();
		expect(screen.getByRole("region", { name: "Event log" }).className).toContain(
			"overflow-hidden",
		);
		expect(screen.getByRole("region", { name: "Learning" })).toBeTruthy();
		expect(screen.getByText("LEARN")).toBeTruthy();
		expect(screen.getByText("OPS")).toBeTruthy();
		expect(screen.getByText(/Issue #66 shared-asset identity is incomplete/)).toBeTruthy();
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
		expect(screen.getByText("Incoming (1)")).toBeTruthy();
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
		expect(screen.getByLabelText("DISK 0 percent")).toBeTruthy();
		expect(screen.getByLabelText("GPU unavailable")).toBeTruthy();
		expect(screen.getAllByText("none").length).toBeGreaterThan(0);
		expect(screen.getAllByText("65536 MiB").length).toBeGreaterThan(0);
		expect(screen.getByText("120 RPS")).toBeTruthy();
		expect(screen.getByText(/Paths 0 ok · 0 miss/)).toBeTruthy();
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
			expect(screen.getByText("Incoming (0)")).toBeTruthy();
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
			expect(screen.getByText("Incoming (0)")).toBeTruthy();
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

	it("keeps Accept enabled while the fleet is empty", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();

		expect(firstAcceptButton()).toBeEnabled();
	});

	it("opens Contract Review and does not charge on Close", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		fireEvent.click(firstAcceptButton());

		expect(screen.getByRole("region", { name: "Contract Review" })).toBeTruthy();
		expect(screen.getByText("$250.00")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Close" }));

		expect(screen.queryByRole("region", { name: "Contract Review" })).toBeNull();
		expect(screen.getByText("$250.00")).toBeTruthy();
		fireEvent.click(firstAcceptButton());
		expect(screen.getByRole("region", { name: "Contract Review" })).toBeTruthy();
	});

	it("posts the advance on Accept contract without needing a server", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		await setupFirstOffer();

		expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
		expect(screen.queryByRole("button", { name: "PARK" })).toBeNull();
		expect(screen.getByText("$330.00")).toBeTruthy();
	});

	it("leases a Bronze without debiting purchase and releases without salvage", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		fireEvent.click(screen.getByRole("button", { name: "Pause" }));

		expect(screen.getByText("$250.00")).toBeTruthy();

		const leaseBronze = screen.getAllByRole("button", { name: "LEASE" })[0];
		if (leaseBronze === undefined) {
			throw new Error("expected a market LEASE button");
		}
		fireEvent.click(leaseBronze);

		await waitFor(() => {
			expect(screen.getByText("Fleet (1)")).toBeTruthy();
		});
		expect(screen.getByText("$250.00")).toBeTruthy();
		expect(within(activeFloor()).getByText("server-1 · leased")).toBeTruthy();
		expect(within(activeFloor()).queryByRole("button", { name: "SELL" })).toBeNull();

		fireEvent.click(within(activeFloor()).getByRole("button", { name: "RELEASE" }));

		await waitFor(() => {
			expect(screen.getByText("Fleet (0)")).toBeTruthy();
		});
		expect(screen.getByText("$250.00")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("assigns the setup box and starts the first install from the ops floor", async () => {
		stubSession();

		renderHub();

		await waitForOpsFloor();
		fireEvent.click(screen.getByRole("button", { name: "Pause" }));
		buyFirstMarketServer();
		await setupFirstOffer();

		fireEvent.click(screen.getByRole("button", { name: "Assign box" }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Install Application Runtime" })).toBeEnabled();
		});

		fireEvent.click(screen.getByRole("button", { name: "Install Application Runtime" }));

		await waitFor(() => {
			expect(screen.getByText("1/1")).toBeTruthy();
		});
		expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
	});
});

describe("PlayButton - hub entry", () => {
	it("always links to the guarded hub", () => {
		render(<PlayButton />);

		expect(screen.getByRole("link", { name: "Play" }).getAttribute("href")).toBe("/hub");
	});
});

describe("HubPage - served card molecule", () => {
	it("renders MOVE and PARK on the active project card Hub uses after Start", () => {
		render(
			<ActiveProjectCard
				currentHourLabel="100%"
				customerName="maya"
				name="maya-appointments"
				onRoute={() => undefined}
				onUnassign={() => undefined}
				paygLabel="$0.00"
				recoveryEtaLabel="—"
				regionLabel="utc+0"
				rollingLabel="—"
				routeLabel="MOVE"
				selectedServerId="server-1"
				serverLabel="server-1 · Bronze"
				serverOptions={[{ id: "server-1", label: "server-1 · Bronze" }]}
				slaLabel="—"
				slaPercent={0}
				slaStatusLabel="warming"
				sparkline={[0.8]}
				sparklineTarget={0.8}
				targetLabel="80.00%"
				unassignLabel="PARK"
			/>,
		);

		expect(screen.getByRole("button", { name: "MOVE" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "PARK" })).toBeEnabled();
	});
});

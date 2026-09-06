import { afterEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { AuthProvider } from "@packages/auth/react";

import { LabPage } from "./lab";

function stubLoggedInHint(present: boolean): void {
	Object.defineProperty(document, "cookie", {
		configurable: true,
		get: () => (present ? "was_logged_in=1" : ""),
		set: () => undefined,
	});
}

function renderLab(): ReturnType<typeof render> {
	return render(
		<AuthProvider
			restoreOnMount={false}
			authOrigin="http://auth.fivenines.com:3001"
			appOrigin="http://play.fivenines.com:3000"
		>
			<LabPage />
		</AuthProvider>,
	);
}

async function waitForLab(): Promise<void> {
	await waitFor(() => {
		expect(screen.getByRole("heading", { name: "Lab" })).toBeTruthy();
	});
}

describe("LabPage - session gate", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("sends the browser to auth login when the public hint cookie is missing", async () => {
		stubLoggedInHint(false);
		const assign = mock(() => undefined);
		window.location.assign = assign as typeof window.location.assign;

		renderLab();

		await waitFor(() => {
			expect(assign).toHaveBeenCalled();
		});
		const calls = assign.mock.calls as unknown as ReadonlyArray<ReadonlyArray<unknown>>;
		expect(String(calls[0]?.[0] ?? "")).toContain("/login?");
		expect(String(calls[0]?.[0] ?? "")).toContain("state=%2Flab");
	});

	it("shows the lab heading when the public hint cookie is set", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();
	});
});

describe("LabPage - tick metrics", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("keeps droppedRequests at zero after Tick while projects stay offered", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const row = screen.getByRole("row", { name: /droppedRequests/ });
		const value = within(row).getByRole("cell");
		expect(Number(value.textContent)).toBe(0);
	});

	it("shows droppedRequests above zero after an offered project is accepted and Tick runs with no servers", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const row = screen.getByRole("row", { name: /droppedRequests/ });
		const value = within(row).getByRole("cell");
		expect(Number(value.textContent)).toBeGreaterThan(0);
	});

	it("handles accepted demand on a Bronze server after Tick", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const handled = screen.getByRole("row", { name: /handledRequests/ });
		const dropped = screen.getByRole("row", { name: /droppedRequests/ });
		expect(Number(within(handled).getByRole("cell").textContent)).toBeGreaterThan(0);
		expect(Number(within(dropped).getByRole("cell").textContent)).toBe(0);
	});

	it("adds a Bronze server when Buy Bronze is clicked", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		expect(screen.getByText("No servers")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));

		expect(screen.getByText(/server-1 Bronze/)).toBeTruthy();
	});

	it("removes a server when Delete is clicked", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Silver" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete server-1" }));

		expect(screen.getByText("No servers")).toBeTruthy();
	});
});

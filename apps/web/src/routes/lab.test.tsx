import { afterEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { AuthProvider } from "@packages/auth/react";
import {
	APPOINTMENT_COMMERCIAL,
	SKU_ECONOMY,
	STARTING_CASH_CENTS,
} from "@packages/fivenines-engine";

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
		expect(String(calls[0]?.[0] ?? "")).toContain(
			"redirect_uri=http%3A%2F%2Fplay.fivenines.com%3A3000%2Flab",
		);
	});

	it("shows the lab heading when the public hint cookie is set", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();
		expect(screen.getByText("Demand inspect")).toBeTruthy();
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

	it("keeps droppedRequests at zero after Accept because setup is not live service", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Accept maya-appointments" }));

		await waitFor(() => {
			expect(screen.getByText(/maya-appointments accepted/)).toBeTruthy();
		});

		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const row = screen.getByRole("row", { name: /droppedRequests/ });
		expect(Number(within(row).getByRole("cell").textContent)).toBe(0);
		expect(screen.getByText("ready no")).toBeTruthy();
	});

	it("handles no live demand on a Bronze after Accept and Tick", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept maya-appointments" }));
		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const handled = screen.getByRole("row", { name: /handledRequests/ });
		const dropped = screen.getByRole("row", { name: /droppedRequests/ });
		expect(Number(within(handled).getByRole("cell").textContent)).toBe(0);
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

	it("adds a Bronze server in utc+9 when that region is selected", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.change(screen.getByLabelText("Region"), { target: { value: "utc+9" } });
		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));

		expect(screen.getByText(/server-1 Bronze utc\+9/)).toBeTruthy();
	});

	it("shows starting cash in cents on the finance strip", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		const row = screen.getByRole("row", { name: /Cash/ });
		expect(Number(within(row).getByRole("cell").textContent)).toBe(STARTING_CASH_CENTS);
	});

	it("drops displayed cash after Buy Bronze", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));

		const row = screen.getByRole("row", { name: /Cash/ });
		expect(Number(within(row).getByRole("cell").textContent)).toBe(
			STARTING_CASH_CENTS - SKU_ECONOMY.bronze.purchaseCents,
		);
	});

	it("disables Buy Gold at start because cash is below purchase", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		expect(screen.getByRole("button", { name: "Buy Gold" })).toBeDisabled();
	});

	it("shows setup copy after Accept instead of SLA digits", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Accept maya-appointments" }));

		expect(screen.getByText(/maya-appointments accepted/)).toBeTruthy();
		expect(screen.getByText("ready no")).toBeTruthy();
		expect(screen.getByText(/Park unavailable during setup/)).toBeTruthy();
	});

	it("credits the advance into cash on Accept without PAYG", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Accept maya-appointments" }));

		await waitFor(() => {
			expect(
				Number(within(screen.getByRole("row", { name: /Cash/ })).getByRole("cell").textContent),
			).toBe(STARTING_CASH_CENTS + APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod);
		});
	});

	it("does not show billing digits on offered project rows", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		const offered = screen.getByText(/maya-appointments offered/).closest("li");
		expect(offered instanceof HTMLElement).toBe(true);
		if (!(offered instanceof HTMLElement)) {
			return;
		}

		expect(within(offered).queryByText(/this-period PAYG/)).toBeNull();
		expect(within(offered).queryByText(/hours served/)).toBeNull();
		expect(within(offered).queryByText(/last settlement/)).toBeNull();
		expect(within(offered).getByText("region utc+0")).toBeTruthy();
		expect(within(offered).getByText("baseline 120")).toBeTruthy();
		expect(within(offered).getByText("traffic saas")).toBeTruthy();
		expect(
			within(offered).getByText(`PAYG ${APPOINTMENT_COMMERCIAL.paygCentsPerThousandHandled}/1000`),
		).toBeTruthy();
		expect(
			within(offered).getByText(`recurring ${APPOINTMENT_COMMERCIAL.recurringCentsPerPeriod}`),
		).toBeTruthy();
		expect(
			within(offered).getByText(`SLA target ${APPOINTMENT_COMMERCIAL.targetPpm}`),
		).toBeTruthy();
		expect(
			within(offered).getByText("penalty mild 25% / severe 50% / catastrophe 100%"),
		).toBeTruthy();
	});

	it("does not show SLA ppm digits on offered project rows", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		const offered = screen.getByText(/maya-appointments offered/).closest("li");
		expect(offered instanceof HTMLElement).toBe(true);
		if (!(offered instanceof HTMLElement)) {
			return;
		}

		expect(within(offered).queryByText(/this-hour/)).toBeNull();
		expect(within(offered).queryByText(/window/)).toBeNull();
	});

	it("removes a server when Delete is clicked", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete server-1" }));

		expect(screen.getByText("No servers")).toBeTruthy();
	});

	it("leases a Bronze without debiting purchase and releases without salvage", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		expect(screen.getByRole("button", { name: "Lease Gold" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: "Lease Bronze" }));

		expect(screen.getByText(/server-1 Bronze utc\+0 leased/)).toBeTruthy();
		expect(screen.getByRole("button", { name: "Release server-1" })).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Delete server-1" })).toBeNull();

		const afterLease = Number(
			within(screen.getByRole("row", { name: /Cash/ })).getByRole("cell").textContent,
		);
		expect(afterLease).toBe(STARTING_CASH_CENTS);
		expect(afterLease).toBeGreaterThan(STARTING_CASH_CENTS - SKU_ECONOMY.bronze.purchaseCents);

		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const leaseCents = Number(
			within(screen.getByRole("row", { name: /Last opex lease/ })).getByRole("cell").textContent,
		);
		const opexTotal = Number(
			within(screen.getByRole("row", { name: /Last opex total/ })).getByRole("cell").textContent,
		);
		const afterTick = Number(
			within(screen.getByRole("row", { name: /Cash/ })).getByRole("cell").textContent,
		);

		expect(leaseCents).toBe(SKU_ECONOMY.bronze.leaseHourlyCents);
		expect(opexTotal).toBeGreaterThan(leaseCents);
		expect(afterTick).toBe(STARTING_CASH_CENTS - opexTotal);

		fireEvent.click(screen.getByRole("button", { name: "Release server-1" }));

		expect(screen.getByText("No servers")).toBeTruthy();
		expect(
			Number(within(screen.getByRole("row", { name: /Cash/ })).getByRole("cell").textContent),
		).toBe(afterTick);
	});
});

describe("LabPage - project routing", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("keeps Accept enabled while the fleet is empty", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		expect(screen.getByRole("button", { name: "Accept maya-appointments" })).toBeEnabled();
	});

	it("accepts without a server and keeps Start blocked", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Accept maya-appointments" }));

		expect(screen.getByText(/maya-appointments accepted/)).toBeTruthy();
		expect(screen.getByText("ready no")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Park maya-appointments" })).toBeNull();
	});
});

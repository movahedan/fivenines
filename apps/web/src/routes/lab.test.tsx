import { afterEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { AuthProvider } from "@packages/auth/react";
import {
	OPENING_COMMERCIAL_STUB,
	PAYG_SETTLE_HOURS,
	paygCentsForHandled,
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

function projectRow(match: RegExp): HTMLElement {
	const row = screen.getByText(match).closest("li");

	if (!(row instanceof HTMLElement)) {
		throw new Error(`expected a project row matching ${String(match)}`);
	}

	return row;
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

	it("shows droppedRequests above zero after a served project is parked and Tick runs", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Park globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const row = screen.getByRole("row", { name: /droppedRequests/ });
		const value = within(row).getByRole("cell");
		expect(Number(value.textContent)).toBeGreaterThan(0);
	});

	it("handles accepted demand on a Bronze server after Tick", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));
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

		expect(screen.getByText(/server-1 Bronze utc\+0/)).toBeTruthy();
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

	it("shows 0 this-hour ppm on a parked project after Tick", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Park globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const parked = screen.getByText(/globex-portal offline/).closest("li");
		expect(parked instanceof HTMLElement).toBe(true);
		if (!(parked instanceof HTMLElement)) {
			return;
		}

		expect(within(parked).getByText("routed parked")).toBeTruthy();
		expect(within(parked).getByText("this-hour 0 ppm")).toBeTruthy();
		expect(within(parked).getByText("window 0 ppm")).toBeTruthy();
	});

	it("credits this-period PAYG and cash after Buy Bronze, Accept, and Tick", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Tick" }));

		const served = screen.getByText(/globex-portal served/).closest("li");
		expect(served instanceof HTMLElement).toBe(true);
		if (!(served instanceof HTMLElement)) {
			return;
		}

		const handled = Number(
			within(screen.getByRole("row", { name: /handledRequests/ })).getByRole("cell").textContent,
		);
		const paygCents = paygCentsForHandled(
			handled,
			OPENING_COMMERCIAL_STUB.paygCentsPerThousandHandled,
		);

		expect(paygCents).toBeGreaterThan(0);
		expect(within(served).getByText(`this-period PAYG ${paygCents}`)).toBeTruthy();
		expect(within(served).getByText("hours served this week 1")).toBeTruthy();
		expect(within(served).getByText("last settlement —")).toBeTruthy();
		expect(within(served).queryByRole("list", { name: "settlement history" })).toBeNull();

		const maintenanceCents = Number(
			within(screen.getByRole("row", { name: /Last opex maintenance/ })).getByRole("cell")
				.textContent,
		);
		const powerCents = Number(
			within(screen.getByRole("row", { name: /Last opex power/ })).getByRole("cell").textContent,
		);
		const cashCents = Number(
			within(screen.getByRole("row", { name: /Cash/ })).getByRole("cell").textContent,
		);
		const receivableCents = Number(
			within(screen.getByRole("row", { name: /Accounts receivable/ })).getByRole("cell")
				.textContent,
		);

		expect(receivableCents).toBe(paygCents);
		expect(cashCents).toBe(
			STARTING_CASH_CENTS - SKU_ECONOMY.bronze.purchaseCents - maintenanceCents - powerCents,
		);
	});

	it("does not show billing digits on offered project rows", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		const offered = screen.getByText(/globex-portal offered/).closest("li");
		expect(offered instanceof HTMLElement).toBe(true);
		if (!(offered instanceof HTMLElement)) {
			return;
		}

		expect(within(offered).queryByText(/this-period PAYG/)).toBeNull();
		expect(within(offered).queryByText(/hours served/)).toBeNull();
		expect(within(offered).queryByText(/last settlement/)).toBeNull();
		expect(within(offered).getByText("region utc+0")).toBeTruthy();
		expect(within(offered).getByText("baseline 700")).toBeTruthy();
		expect(within(offered).getByText("traffic saas")).toBeTruthy();
		expect(within(offered).getByText("spikes campaign-prone")).toBeTruthy();
		expect(
			within(offered).getByText(`PAYG ${OPENING_COMMERCIAL_STUB.paygCentsPerThousandHandled}/1000`),
		).toBeTruthy();
		expect(
			within(offered).getByText(`recurring ${OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod}`),
		).toBeTruthy();
		expect(
			within(offered).getByText(`SLA target ${OPENING_COMMERCIAL_STUB.targetPpm}`),
		).toBeTruthy();
		expect(
			within(offered).getByText("penalty mild 25% / severe 50% / catastrophe 100%"),
		).toBeTruthy();
	});

	it("does not show SLA ppm digits on offered project rows", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		const offered = screen.getByText(/globex-portal offered/).closest("li");
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

	it("disables Accept while the fleet is empty", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		expect(screen.getByRole("button", { name: "Accept globex-portal" })).toBeDisabled();
	});

	it("shows the routed server on a project accepted onto the selected box", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));

		expect(within(projectRow(/globex-portal served/)).getByText("routed server-1")).toBeTruthy();
	});

	it("parks a served project and assigns it back onto a server", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept globex-portal" }));
		fireEvent.click(screen.getByRole("button", { name: "Park globex-portal" }));

		expect(within(projectRow(/globex-portal offline/)).getByText("routed parked")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Assign globex-portal" }));

		expect(within(projectRow(/globex-portal served/)).getByText("routed server-1")).toBeTruthy();
	});

	it("shows the new routed server after a served project is moved", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));
		fireEvent.click(screen.getByRole("button", { name: "Accept acme-web" }));

		for (let hour = 0; hour < PAYG_SETTLE_HOURS; hour += 1) {
			fireEvent.click(screen.getByRole("button", { name: "Tick" }));
		}

		fireEvent.click(screen.getByRole("button", { name: "Lease Thin RAM" }));
		fireEvent.change(screen.getByLabelText("Server"), { target: { value: "server-2" } });
		fireEvent.click(screen.getByRole("button", { name: "Move acme-web" }));

		expect(within(projectRow(/acme-web served/)).getByText("routed server-2")).toBeTruthy();
	});
});

describe("LabPage - outage and monitoring", () => {
	afterEach(() => {
		mock.restore();
		Reflect.deleteProperty(document, "cookie");
	});

	it("shows health after a triggered outage, restores on repair, and offers install monitoring", async () => {
		stubLoggedInHint(true);

		renderLab();

		await waitForLab();

		fireEvent.click(screen.getByRole("button", { name: "Buy Bronze" }));

		expect(screen.getByRole("button", { name: /Install monitoring server-1/ })).toBeTruthy();
		expect(screen.getByText(/server-1 Bronze utc\+0 owned ok unmonitored/)).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Trigger outage server-1" }));

		expect(screen.getByText(/server-1 Bronze utc\+0 owned (degraded|unavailable)/)).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Repair server-1" }));

		expect(screen.getByText(/server-1 Bronze utc\+0 owned ok unmonitored/)).toBeTruthy();
	});
});

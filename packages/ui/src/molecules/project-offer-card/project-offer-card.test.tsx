import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { ProjectOfferCard } from "./project-offer-card";

const OFFER = {
	customerName: "ACME",
	name: "web-prod",
	regionLabel: "UTC-8",
	cpuLabel: "4c",
	paygLabel: "$12/hr",
	slaLabel: "99.9%",
} as const;

describe("ProjectOfferCard", () => {
	it("renders customer, name, region, and metrics when given props", () => {
		render(<ProjectOfferCard {...OFFER} onAccept={mock()} onDecline={mock()} />);

		expect(screen.getByText("ACME")).toBeInTheDocument();
		expect(screen.getByText("web-prod")).toBeInTheDocument();
		expect(screen.getByText("UTC-8")).toBeInTheDocument();
		expect(screen.getByText("4c")).toBeInTheDocument();
		expect(screen.getByText("$12/hr")).toBeInTheDocument();
		expect(screen.getByText("99.9%")).toBeInTheDocument();
	});

	it("calls onAccept when ACCEPT is pressed", () => {
		const onAccept = mock();

		render(<ProjectOfferCard {...OFFER} onAccept={onAccept} onDecline={mock()} />);

		fireEvent.click(screen.getByRole("button", { name: "ACCEPT" }));

		expect(onAccept).toHaveBeenCalledTimes(1);
	});

	it("calls onDecline when DECLINE is pressed", () => {
		const onDecline = mock();

		render(<ProjectOfferCard {...OFFER} onAccept={mock()} onDecline={onDecline} />);

		fireEvent.click(screen.getByRole("button", { name: "DECLINE" }));

		expect(onDecline).toHaveBeenCalledTimes(1);
	});

	it("keeps DECLINE enabled when ACCEPT is disabled", () => {
		const onDecline = mock();

		render(<ProjectOfferCard {...OFFER} disabled onAccept={mock()} onDecline={onDecline} />);

		expect(screen.getByRole("button", { name: "ACCEPT" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "DECLINE" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: "DECLINE" }));

		expect(onDecline).toHaveBeenCalledTimes(1);
	});
});

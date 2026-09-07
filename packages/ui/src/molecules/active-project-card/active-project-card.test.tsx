import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { ActiveProjectCard } from "./active-project-card";

const ACTIVE = {
	customerName: "ACME",
	name: "web-prod",
	regionLabel: "UTC-8",
	slaLabel: "99.95%",
	slaStatusLabel: "OK",
	slaPercent: 82,
	currentHourLabel: "100%",
	rollingLabel: "99.95%",
	targetLabel: "99.00%",
	recoveryEtaLabel: "31 healthy hours",
	sparklineTarget: 0.99,
	serverLabel: "m5.large #A1F2",
	paygLabel: "+$12/hr",
} as const;

describe("ActiveProjectCard", () => {
	it("renders identity, SLA, server, and payg when given props", () => {
		render(<ActiveProjectCard {...ACTIVE} sparkline={[0.8, 0.9, 0.4]} />);

		expect(screen.getByText("ACME")).toBeInTheDocument();
		expect(screen.getByText("web-prod")).toBeInTheDocument();
		expect(screen.getByText("UTC-8")).toBeInTheDocument();
		expect(screen.getByText("99.95% · OK")).toBeInTheDocument();
		expect(screen.getByText("m5.large #A1F2")).toBeInTheDocument();
		expect(screen.getByText("+$12/hr")).toBeInTheDocument();
	});

	it("renders the warming label when the sparkline is empty", () => {
		render(<ActiveProjectCard {...ACTIVE} sparkline={[]} sparklineWarmingLabel="WARMING UP..." />);

		expect(screen.getByText("WARMING UP...")).toBeInTheDocument();
	});

	it("does not use bg-primary on sparkline bars below sparklineTarget", () => {
		render(<ActiveProjectCard {...ACTIVE} sparkline={[0.8]} sparklineTarget={0.99} />);

		expect(screen.getByTestId("sparkline-bar-bg-destructive")).toBeInTheDocument();
		expect(screen.queryByTestId("sparkline-bar-bg-primary")).not.toBeInTheDocument();
	});

	it("renders WTD revenue and SLA metric captions when given labels", () => {
		render(<ActiveProjectCard {...ACTIVE} sparkline={[0.8]} />);

		expect(screen.getByText("WTD revenue")).toBeInTheDocument();
		expect(screen.getByText("Current hour")).toBeInTheDocument();
		expect(screen.getByText("Rolling 168h")).toBeInTheDocument();
		expect(screen.getByText("Target")).toBeInTheDocument();
		expect(screen.getByText("Recovery ETA")).toBeInTheDocument();
	});
});

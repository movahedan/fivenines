import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

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

const SERVER_OPTIONS = [
	{ id: "srv-a", label: "t3.small #D4E9" },
	{ id: "srv-b", label: "c5.xlarge #B7C3" },
] as const;

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

	it("renders no picker and no actions row without the routing props", () => {
		render(<ActiveProjectCard {...ACTIVE} sparkline={[0.8]} />);

		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.getByText("m5.large #A1F2")).toBeInTheDocument();
	});

	it("renders a labelled server picker when serverOptions is given", () => {
		render(<ActiveProjectCard {...ACTIVE} serverOptions={SERVER_OPTIONS} sparkline={[0.8]} />);

		expect(screen.getByLabelText("Server")).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "t3.small #D4E9" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "c5.xlarge #B7C3" })).toBeInTheDocument();
	});

	it("calls onSelectServer with the picked id when the picker changes", () => {
		const onSelectServer = mock();

		render(
			<ActiveProjectCard
				{...ACTIVE}
				onSelectServer={onSelectServer}
				serverOptions={SERVER_OPTIONS}
				sparkline={[0.8]}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Server"), { target: { value: "srv-b" } });

		expect(onSelectServer).toHaveBeenCalledTimes(1);
		expect(onSelectServer).toHaveBeenCalledWith("srv-b");
	});

	it("renders only the route button when onRoute is given", () => {
		render(<ActiveProjectCard {...ACTIVE} onRoute={mock()} sparkline={[0.8]} />);

		expect(screen.getByRole("button", { name: "MOVE" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "PARK" })).not.toBeInTheDocument();
	});

	it("renders only the unassign button when onUnassign is given", () => {
		const onUnassign = mock();

		render(<ActiveProjectCard {...ACTIVE} onUnassign={onUnassign} sparkline={[0.8]} />);

		expect(screen.queryByRole("button", { name: "MOVE" })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "PARK" }));

		expect(onUnassign).toHaveBeenCalledTimes(1);
	});

	it("uses routeLabel and unassignLabel when given", () => {
		render(
			<ActiveProjectCard
				{...ACTIVE}
				onRoute={mock()}
				onUnassign={mock()}
				routeLabel="ASSIGN"
				sparkline={[0.8]}
				unassignLabel="RELEASE"
			/>,
		);

		expect(screen.getByRole("button", { name: "ASSIGN" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "RELEASE" })).toBeInTheDocument();
	});

	it("disables the route button until a server is selected", () => {
		const onRoute = mock();
		const { unmount } = render(
			<ActiveProjectCard
				{...ACTIVE}
				onRoute={onRoute}
				serverOptions={SERVER_OPTIONS}
				sparkline={[0.8]}
			/>,
		);

		expect(screen.getByRole("button", { name: "MOVE" })).toBeDisabled();

		unmount();

		render(
			<ActiveProjectCard
				{...ACTIVE}
				onRoute={onRoute}
				selectedServerId="srv-a"
				serverOptions={SERVER_OPTIONS}
				sparkline={[0.8]}
			/>,
		);

		expect(screen.getByRole("button", { name: "MOVE" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: "MOVE" }));

		expect(onRoute).toHaveBeenCalledTimes(1);
	});

	it("disables the route button when serverOptions is empty", () => {
		render(
			<ActiveProjectCard
				{...ACTIVE}
				onRoute={mock()}
				selectedServerId="srv-a"
				serverOptions={[]}
				sparkline={[0.8]}
			/>,
		);

		expect(screen.getByRole("button", { name: "MOVE" })).toBeDisabled();
	});
});

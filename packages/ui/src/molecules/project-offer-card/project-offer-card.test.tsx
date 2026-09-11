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

const SERVER_OPTIONS = [
	{ id: "srv-a", label: "m5.large #A1F2" },
	{ id: "srv-b", label: "c5.xlarge #B7C3" },
] as const;

describe("ProjectOfferCard", () => {
	it("renders customer, name, region, and metrics when given props", () => {
		render(<ProjectOfferCard {...OFFER} onAccept={mock()} onDecline={mock()} />);

		expect(screen.getByText("ACME")).toBeInTheDocument();
		expect(screen.getByText("web-prod")).toBeInTheDocument();
		expect(screen.getByText("UTC-8")).toBeInTheDocument();
		expect(screen.getByText("4c")).toBeInTheDocument();
		expect(screen.getByText("DEMAND")).toBeInTheDocument();
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

	it("renders no server picker when serverOptions is omitted", () => {
		render(<ProjectOfferCard {...OFFER} onAccept={mock()} onDecline={mock()} />);

		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
		expect(screen.queryByText("Server")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "ACCEPT" })).toBeEnabled();
	});

	it("renders a labelled server picker when serverOptions is given", () => {
		render(
			<ProjectOfferCard
				{...OFFER}
				onAccept={mock()}
				onDecline={mock()}
				serverOptions={SERVER_OPTIONS}
			/>,
		);

		expect(screen.getByLabelText("Server")).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "m5.large #A1F2" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "c5.xlarge #B7C3" })).toBeInTheDocument();
	});

	it("uses serverSelectLabel as the picker accessible name when given", () => {
		render(
			<ProjectOfferCard
				{...OFFER}
				onAccept={mock()}
				onDecline={mock()}
				serverOptions={SERVER_OPTIONS}
				serverSelectLabel="Target box"
			/>,
		);

		expect(screen.getByLabelText("Target box")).toBeInTheDocument();
	});

	it("calls onSelectServer with the picked id when the picker changes", () => {
		const onSelectServer = mock();

		render(
			<ProjectOfferCard
				{...OFFER}
				onAccept={mock()}
				onDecline={mock()}
				onSelectServer={onSelectServer}
				serverOptions={SERVER_OPTIONS}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Server"), { target: { value: "srv-b" } });

		expect(onSelectServer).toHaveBeenCalledTimes(1);
		expect(onSelectServer).toHaveBeenCalledWith("srv-b");
	});

	it("disables ACCEPT until a server is selected", () => {
		const { unmount } = render(
			<ProjectOfferCard
				{...OFFER}
				onAccept={mock()}
				onDecline={mock()}
				serverOptions={SERVER_OPTIONS}
			/>,
		);

		expect(screen.getByRole("button", { name: "ACCEPT" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "DECLINE" })).toBeEnabled();

		unmount();

		render(
			<ProjectOfferCard
				{...OFFER}
				onAccept={mock()}
				onDecline={mock()}
				selectedServerId="srv-a"
				serverOptions={SERVER_OPTIONS}
			/>,
		);

		expect(screen.getByRole("button", { name: "ACCEPT" })).toBeEnabled();
	});

	it("renders noServersLabel and disables ACCEPT when serverOptions is empty", () => {
		render(
			<ProjectOfferCard
				{...OFFER}
				noServersLabel="NO BOXES"
				onAccept={mock()}
				onDecline={mock()}
				serverOptions={[]}
			/>,
		);

		expect(screen.getByText("NO BOXES")).toBeInTheDocument();
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "ACCEPT" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "DECLINE" })).toBeEnabled();
	});
});

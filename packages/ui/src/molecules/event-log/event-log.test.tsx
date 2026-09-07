import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { EventLog, type EventLogEntry } from "./event-log";

const ENTRIES: readonly EventLogEntry[] = [
	{
		id: "1",
		tickLabel: "W1 T12",
		message: "Offer accepted",
		tone: "success",
	},
	{
		id: "2",
		tickLabel: "W1 T13",
		message: "SLA warning",
		tone: "warn",
	},
];

describe("EventLog", () => {
	it("renders tick labels and messages when given entries", () => {
		render(<EventLog entries={ENTRIES} />);

		expect(screen.getByText("[W1 T12]")).toBeInTheDocument();
		expect(screen.getByText("Offer accepted")).toBeInTheDocument();
		expect(screen.getByText("[W1 T13]")).toBeInTheDocument();
		expect(screen.getByText("SLA warning")).toBeInTheDocument();
	});

	it("renders an empty log when there are no entries", () => {
		const { container } = render(<EventLog entries={[]} />);

		expect(container).toBeInTheDocument();
		expect(screen.queryByText("Offer accepted")).not.toBeInTheDocument();
	});

	it("exposes a scroller test id for a bounded parent", () => {
		render(<EventLog entries={ENTRIES} />);

		expect(screen.getByTestId("event-log-scroller")).toBeInTheDocument();
	});
});

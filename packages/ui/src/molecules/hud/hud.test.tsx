import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { Text } from "../../atoms/text";
import { Hud } from "./hud";

const METRICS = [
	{ label: "CASH", value: "$12,400", tone: "primary" as const },
	{ label: "SLA", value: "99.9%" },
];

describe("Hud", () => {
	it("renders title, tick, and metrics when given props", () => {
		render(
			<Hud
				title="Five Nines"
				subtitle="Opening Shift"
				tickLabel="W1 T04"
				clockLabel="00:12:00"
				metrics={METRICS}
				running
				onToggleRunning={mock()}
			/>,
		);

		expect(screen.getByText("Five Nines")).toBeInTheDocument();
		expect(screen.getByText("Opening Shift")).toBeInTheDocument();
		expect(screen.getByText("W1 T04")).toBeInTheDocument();
		expect(screen.getByText("00:12:00")).toBeInTheDocument();
		expect(screen.getByText("CASH")).toBeInTheDocument();
		expect(screen.getByText("$12,400")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
	});

	it("calls onToggleRunning when the pause control is pressed", () => {
		const onToggleRunning = mock();

		render(
			<Hud
				title="Five Nines"
				tickLabel="W1 T04"
				metrics={METRICS}
				running
				onToggleRunning={onToggleRunning}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Pause" }));

		expect(onToggleRunning).toHaveBeenCalledTimes(1);
	});

	it("shows resume and jail chrome when paused and jailed", () => {
		render(
			<Hud
				title="Five Nines"
				tickLabel="W1 T04"
				metrics={METRICS}
				running={false}
				jailed
				onToggleRunning={mock()}
				account={<Text>ops@five</Text>}
			/>,
		);

		expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
		expect(screen.getByText("JAILED")).toBeInTheDocument();
		expect(screen.getByText("ops@five")).toBeInTheDocument();
	});
});

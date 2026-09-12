import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { GameClockControls } from "./game-clock-controls";

describe("GameClockControls", () => {
	it("renders the date label and selected speed when given clock props", () => {
		render(
			<GameClockControls
				dateLabel="Sep 11, 2026"
				dayProgress={0.4}
				onSpeedChange={mock()}
				speed={1}
			/>,
		);

		expect(screen.getByText("Sep 11, 2026")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Speed ×1" })).toBeInTheDocument();
	});

	it("calls onSpeedChange when a speed control is pressed", () => {
		const onSpeedChange = mock();

		render(
			<GameClockControls
				dateLabel="Sep 11, 2026"
				dayProgress={0.4}
				onSpeedChange={onSpeedChange}
				speed={1}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Speed ×4" }));

		expect(onSpeedChange).toHaveBeenCalledWith(4);
	});

	it("stacks the date above the speed cluster when density is mobile", () => {
		render(
			<GameClockControls
				dateLabel="Sep 11, 2026"
				dayProgress={0.4}
				density="mobile"
				onSpeedChange={mock()}
				speed={1}
			/>,
		);

		expect(screen.getByText("Sep 11, 2026")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
	});
});

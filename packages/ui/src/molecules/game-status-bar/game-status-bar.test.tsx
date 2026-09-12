import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { Text } from "../../atoms/text";
import { GameStatusBar } from "./game-status-bar";

describe("GameStatusBar", () => {
	it("renders slotted regions when given children", () => {
		render(
			<GameStatusBar
				leading={<Text>account</Text>}
				metrics={<Text>cash</Text>}
				operationsProgress={<Text>ops</Text>}
				learningProgress={<Text>learn</Text>}
				clockControls={<Text>clock</Text>}
				trailing={<Text>activity</Text>}
			/>,
		);

		expect(screen.getByText("account")).toBeInTheDocument();
		expect(screen.getByText("cash")).toBeInTheDocument();
		expect(screen.getByText("ops")).toBeInTheDocument();
		expect(screen.getByText("learn")).toBeInTheDocument();
		expect(screen.getByText("clock")).toBeInTheDocument();
		expect(screen.getByText("activity")).toBeInTheDocument();
	});

	it("shows a single idle caption when no pipelines are slotted", () => {
		render(<GameStatusBar metrics={<Text>cash</Text>} />);

		expect(screen.getByText("No active tasks")).toBeInTheDocument();
	});

	it("omits the idle caption when an operations pipeline is slotted", () => {
		render(<GameStatusBar metrics={<Text>cash</Text>} operationsProgress={<Text>ops</Text>} />);

		expect(screen.getByText("ops")).toBeInTheDocument();
		expect(screen.queryByText("No active tasks")).not.toBeInTheDocument();
	});

	it("omits the idle caption when task group is hidden", () => {
		render(<GameStatusBar density="mobile" metrics={<Text>cash</Text>} showTaskGroup={false} />);

		expect(screen.queryByText("No active tasks")).not.toBeInTheDocument();
	});

	it("sticks to the bottom of the parent when placement is absolute", () => {
		render(<GameStatusBar placement="absolute" metrics={<Text>cash</Text>} />);

		expect(screen.getByTestId("game-status-bar-absolute")).toBeInTheDocument();
	});
});

import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { GamePipelineChip } from "./game-pipeline-chip";

describe("GamePipelineChip", () => {
	it("renders the task label and remaining-work detail", () => {
		render(
			<GamePipelineChip detail="2h" label="Install Application Runtime" progress={0} tone="ops" />,
		);

		expect(screen.getByText("Install Application Runtime")).toBeInTheDocument();
		expect(screen.getByText("2h")).toBeInTheDocument();
	});

	it("renders a full-width flush row when the mobile strip is shown", () => {
		render(
			<GamePipelineChip detail="40%" flush label="Capacity planning" progress={40} tone="learn" />,
		);

		expect(screen.getByText("Capacity planning")).toBeInTheDocument();
		expect(screen.getByText("40%")).toBeInTheDocument();
	});
});

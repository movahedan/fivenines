import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { GameLearningPanel } from "./game-learning-panel";

const technologies = [
	{
		id: "application-runtime",
		name: "Application Runtime",
		family: "Application",
		status: "completed" as const,
		description: "Base runtime.",
		requires: [],
	},
	{
		id: "monitoring",
		name: "Monitoring",
		family: "Observability",
		status: "available" as const,
		description: "Collects metrics.",
		requires: ["Application Runtime"],
		researchHours: 168,
		tuitionLabel: "$40.00/mo",
	},
];

const courses = [
	{
		id: "system-administration",
		name: "System Administration",
		mark: "SY",
		status: "available" as const,
		currentLevel: 0,
		maxLevel: 5,
		effect: "configurationIncidentProbability",
		tuitionLabel: "$20.00/mo",
		durationLabel: "1w",
	},
];

describe("GameLearningPanel", () => {
	it("shows the idle ongoing banner and technology rows", () => {
		render(
			<GameLearningPanel
				courses={courses}
				ongoing={[]}
				onEnrollCourse={mock()}
				onPause={mock()}
				onResume={mock()}
				onStartResearch={mock()}
				technologies={technologies}
			/>,
		);

		expect(screen.getByText("No active study")).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Technologies" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Application Runtime" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Monitoring" })).toBeInTheDocument();
	});

	it("opens a technology detail and starts research", () => {
		const onStartResearch = mock();

		render(
			<GameLearningPanel
				courses={courses}
				ongoing={[]}
				onEnrollCourse={mock()}
				onPause={mock()}
				onResume={mock()}
				onStartResearch={onStartResearch}
				technologies={technologies}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Monitoring" }));
		fireEvent.click(screen.getByRole("button", { name: "Start research" }));

		expect(onStartResearch).toHaveBeenCalledWith("monitoring");
	});

	it("switches to courses and enrolls from the detail", () => {
		const onEnrollCourse = mock();

		render(
			<GameLearningPanel
				courses={courses}
				ongoing={[{ id: "monitoring", name: "Monitoring", detail: "Observability", mark: "O" }]}
				onEnrollCourse={onEnrollCourse}
				onPause={mock()}
				onResume={mock()}
				onStartResearch={mock()}
				technologies={technologies}
			/>,
		);

		expect(screen.queryByText("No active study")).not.toBeInTheDocument();
		expect(screen.getByText("ONGOING")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("tab", { name: "Courses" }));
		fireEvent.click(screen.getByRole("button", { name: "System Administration" }));
		fireEvent.click(screen.getByRole("button", { name: "Enroll — $20.00/mo" }));

		expect(onEnrollCourse).toHaveBeenCalledWith("system-administration");
	});
});

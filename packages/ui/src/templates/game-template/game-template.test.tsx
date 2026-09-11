import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";
import { type ReactElement, useState } from "react";

import { Text } from "../../atoms/text";
import { GameTemplate } from "./game-template";
import type {
	GameDestination,
	GameRightDestination,
	GameTemplateProps,
} from "./game-template.types";
import { clampGamePanelWidth } from "./game-template.types";

function Slot({ label }: { label: string }) {
	return <Text>{label}</Text>;
}

function Harness({
	isMobile,
	onNewProject = mock(),
}: {
	isMobile: boolean;
	onNewProject?: ReturnType<typeof mock>;
}): ReactElement {
	const [destination, setDestination] = useState<GameDestination>("projects");
	const [projectsOpen, setProjectsOpen] = useState(true);
	const [rightDestination, setRightDestination] = useState<GameRightDestination>(null);
	const [activityOpen, setActivityOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [projectsWidth, setProjectsWidth] = useState(220);
	const [rightWidth, setRightWidth] = useState(260);

	const props: GameTemplateProps = {
		accountControl: (
			<Text
				accessibilityRole="button"
				onPress={() => {
					setAccountOpen(true);
				}}
			>
				Operator
			</Text>
		),
		accountOpen,
		accountOverlay: <Slot label="account body" />,
		activityOpen,
		activityOverlay: <Slot label="activity body" />,
		centerContent: <Slot label="center" />,
		centerKind: "project",
		clockControls: <Slot label="clock" />,
		destination,
		financesPanel: <Slot label="finances" />,
		inventoryPanel: <Slot label="inventory" />,
		isMobile,
		learningPanel: <Slot label="learning" />,
		learningProgress: <Slot label="learn slot" />,
		objectDrawer: <Slot label="drawer" />,
		onActivityOpenChange: setActivityOpen,
		onAccountOpenChange: setAccountOpen,
		onDestinationChange: setDestination,
		onNewProject,
		onProjectsOpenChange: setProjectsOpen,
		onProjectsWidthChange: setProjectsWidth,
		onRightDestinationChange: setRightDestination,
		onRightWidthChange: setRightWidth,
		operationsProgress: <Slot label="ops slot" />,
		projectsOpen,
		projectsPanel: <Slot label="projects list" />,
		projectsWidth,
		rightDestination,
		rightWidth,
		statusMetrics: <Slot label="cash" />,
	};

	return <GameTemplate {...props} />;
}

describe("GameTemplate", () => {
	it("places the same destinations on desktop rails when given desktop layout", () => {
		render(<Harness isMobile={false} />);

		expect(screen.getByText("projects list")).toBeInTheDocument();
		expect(screen.getByText("center")).toBeInTheDocument();
		expect(screen.getByLabelText("Inventory")).toBeInTheDocument();
		expect(screen.getByLabelText("Learning")).toBeInTheDocument();
		expect(screen.getByLabelText("Finances")).toBeInTheDocument();
		expect(screen.getByText("drawer")).toBeInTheDocument();
	});

	it("opens a slotted activity overlay when the default trigger is pressed", () => {
		render(<Harness isMobile={false} />);

		fireEvent.click(screen.getByRole("button", { name: "Activity" }));

		expect(screen.getByRole("dialog", { name: "Activity" })).toBeInTheDocument();
		expect(screen.getByText("activity body")).toBeInTheDocument();
	});

	it("calls onNewProject when the mobile action is pressed", () => {
		const onNewProject = mock();

		render(<Harness isMobile onNewProject={onNewProject} />);

		fireEvent.click(screen.getByRole("button", { name: "New project" }));

		expect(onNewProject).toHaveBeenCalledTimes(1);
	});

	it("shows the inventory destination when a mobile tab is pressed", () => {
		render(<Harness isMobile />);

		fireEvent.click(screen.getByRole("button", { name: "Inventory" }));

		expect(screen.getByText("inventory")).toBeInTheDocument();
	});
});

describe("clampGamePanelWidth", () => {
	it("keeps widths inside the agreed panel bounds", () => {
		expect(clampGamePanelWidth(80)).toBe(160);
		expect(clampGamePanelWidth(900)).toBe(520);
		expect(clampGamePanelWidth(200.8)).toBe(201);
	});
});

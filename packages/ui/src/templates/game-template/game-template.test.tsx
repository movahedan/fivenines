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
		objectDrawer: undefined,
		onActivityOpenChange: setActivityOpen,
		onAccountOpenChange: setAccountOpen,
		onDestinationChange: setDestination,
		onNewProject,
		onProjectsOpenChange: setProjectsOpen,
		onProjectsWidthChange: setProjectsWidth,
		onRightDestinationChange: setRightDestination,
		onRightWidthChange: setRightWidth,
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
		expect(screen.getByRole("button", { name: "Open Inventory" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Open Learning" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Open Finances" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Collapse Projects" })).toBeInTheDocument();
		expect(screen.getByText("No active tasks")).toBeInTheDocument();
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

	it("shows a dimmed overlay and bottom sheet when object details are open", () => {
		const onObjectDrawerClose = mock();

		render(
			<GameTemplate
				accountControl={<Slot label="op" />}
				accountOpen={false}
				accountOverlay={<Slot label="account body" />}
				activityOpen={false}
				activityOverlay={<Slot label="activity body" />}
				centerContent={<Slot label="center" />}
				centerKind="project"
				clockControls={<Slot label="clock" />}
				destination="projects"
				financesPanel={<Slot label="finances" />}
				inventoryPanel={<Slot label="inventory" />}
				isMobile={false}
				learningPanel={<Slot label="learning" />}
				objectDrawer={<Slot label="server details" />}
				objectDrawerTitle="Object details"
				onAccountOpenChange={mock()}
				onActivityOpenChange={mock()}
				onDestinationChange={mock()}
				onNewProject={mock()}
				onObjectDrawerClose={onObjectDrawerClose}
				onProjectsOpenChange={mock()}
				onProjectsWidthChange={mock()}
				onRightDestinationChange={mock()}
				onRightWidthChange={mock()}
				projectsOpen
				projectsPanel={<Slot label="projects list" />}
				projectsWidth={220}
				rightDestination={null}
				rightWidth={260}
				statusMetrics={<Slot label="cash" />}
			/>,
		);

		expect(screen.getByRole("dialog", { name: "Object details" })).toBeInTheDocument();
		expect(screen.getByText("server details")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Dismiss Object details" }));

		expect(onObjectDrawerClose).toHaveBeenCalledTimes(1);
	});

	it("shows the inventory destination when a mobile tab is pressed", () => {
		render(<Harness isMobile />);

		fireEvent.click(screen.getByRole("button", { name: "Inventory" }));

		expect(screen.getByText("inventory")).toBeInTheDocument();
		expect(screen.queryByText("No active tasks")).not.toBeInTheDocument();
	});
});

describe("clampGamePanelWidth", () => {
	it("keeps widths inside the agreed panel bounds", () => {
		expect(clampGamePanelWidth(80)).toBe(160);
		expect(clampGamePanelWidth(900)).toBe(520);
		expect(clampGamePanelWidth(200.8)).toBe(201);
	});
});

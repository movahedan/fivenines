import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { View } from "react-native";

import { Text } from "../../atoms/text";
import { GameAccountControl } from "../../molecules/game-account-control/game-account-control";
import { GameClockControls } from "../../molecules/game-clock-controls/game-clock-controls";
import { GamePipelineChip } from "../../molecules/game-pipeline-chip/game-pipeline-chip";
import { MetricStat } from "../../molecules/metric-stat/metric-stat";
import { GameTemplate } from "./game-template";
import type { GameDestination, GameRightDestination } from "./game-template.types";

function Placeholder({ label }: { label: string }) {
	return (
		<View className="p-4">
			<Text className="text-sm text-muted-foreground">{label}</Text>
		</View>
	);
}

function CashGroup({ compact }: { compact: boolean }) {
	return (
		<>
			<MetricStat
				compact={compact}
				label="CASH"
				tone="primary"
				value={compact ? "♦500" : "♦500.00"}
			/>
			<MetricStat compact={compact} label="REP" value="0" />
			<MetricStat compact={compact} label="OPEX" value={compact ? "♦9" : "♦8.90"} />
		</>
	);
}

function GameTemplatePlayground({
	isMobile,
	drawerOpen,
	busy,
}: {
	isMobile: boolean;
	drawerOpen?: boolean;
	busy?: boolean;
}) {
	const [destination, setDestination] = useState<GameDestination>("projects");
	const [projectsOpen, setProjectsOpen] = useState(true);
	const [rightDestination, setRightDestination] = useState<GameRightDestination>(null);
	const [activityOpen, setActivityOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [projectsWidth, setProjectsWidth] = useState(220);
	const [rightWidth, setRightWidth] = useState(260);
	const [speed, setSpeed] = useState<0 | 1 | 2 | 4>(1);
	const [detailsOpen, setDetailsOpen] = useState(drawerOpen ?? false);

	const opsChip = (
		<GamePipelineChip detail="1h" label="App Runtime install" progress={55} tone="ops" />
	);
	const learnChip = (
		<GamePipelineChip detail="40%" label="Capacity planning" progress={40} tone="learn" />
	);
	const opsRow = (
		<GamePipelineChip detail="1h" flush label="App Runtime install" progress={55} tone="ops" />
	);
	const learnRow = (
		<GamePipelineChip detail="40%" flush label="Capacity planning" progress={40} tone="learn" />
	);

	return (
		<View style={{ height: "100%", flex: 1 }}>
			<GameTemplate
				accountControl={
					<GameAccountControl
						compact={isMobile}
						onPress={() => {
							setAccountOpen(true);
						}}
					/>
				}
				accountOpen={accountOpen}
				accountOverlay={<Placeholder label="Settings and Sign out" />}
				activityOpen={activityOpen}
				activityOverlay={<Placeholder label="Event history" />}
				centerContent={<Placeholder label="Project workspace" />}
				centerKind="project"
				clockControls={
					<GameClockControls
						dateLabel="Sep 11, 2026"
						dayProgress={0.42}
						density={isMobile ? "mobile" : "desktop"}
						onSpeedChange={setSpeed}
						speed={speed}
					/>
				}
				destination={destination}
				financesPanel={<Placeholder label="Business finances" />}
				inventoryPanel={<Placeholder label="Inventory" />}
				isMobile={isMobile}
				learningPanel={<Placeholder label="Learning" />}
				learningProgress={busy && !isMobile ? learnChip : undefined}
				mobileProgressStrip={
					busy && isMobile ? (
						<View className="border-b border-border">
							{opsRow}
							{learnRow}
						</View>
					) : undefined
				}
				objectDrawer={
					detailsOpen ? (
						<View className="gap-3 p-4">
							<Text className="text-sm font-semibold text-foreground">
								Server · Maya's Appointments
							</Text>
							<Text className="text-xs text-muted-foreground">
								Object details sit in a bottom sheet with a dimmed overlay. The template owns
								chrome; this body is a slot.
							</Text>
							<Text className="text-xs text-muted-foreground">
								Region · starter-1 · 2 vCPU · 4 GiB
							</Text>
						</View>
					) : undefined
				}
				objectDrawerTitle="Object details"
				onAccountOpenChange={setAccountOpen}
				onActivityOpenChange={setActivityOpen}
				onDestinationChange={setDestination}
				onNewProject={() => {
					setDestination("projects");
				}}
				onObjectDrawerClose={() => {
					setDetailsOpen(false);
				}}
				onProjectsOpenChange={setProjectsOpen}
				onProjectsWidthChange={setProjectsWidth}
				onRightDestinationChange={setRightDestination}
				onRightWidthChange={setRightWidth}
				operationsProgress={busy && !isMobile ? opsChip : undefined}
				projectsOpen={projectsOpen}
				projectsPanel={<Placeholder label="Projects list" />}
				projectsWidth={projectsWidth}
				rightDestination={rightDestination}
				rightWidth={rightWidth}
				statusMetrics={<CashGroup compact={isMobile} />}
			/>
		</View>
	);
}

const meta: Meta<typeof GameTemplatePlayground> = {
	title: "Templates/GameTemplate",
	component: GameTemplatePlayground,
	parameters: {
		layout: "fullscreen",
		controls: {
			include: ["isMobile"],
		},
		docs: {
			description: {
				component:
					"Desktop folder tabs and mobile destinations around the same slotted sections. Business state stays in the parent.",
			},
		},
	},
	argTypes: {
		isMobile: { control: "boolean" },
		drawerOpen: { table: { disable: true } },
		busy: { table: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	args: {
		isMobile: false,
	},
};

export const Mobile: Story = {
	args: {
		isMobile: true,
	},
};

export const DesktopBusy: Story = {
	args: {
		isMobile: false,
		busy: true,
	},
};

export const MobileBusy: Story = {
	args: {
		isMobile: true,
		busy: true,
	},
};

export const DrawerOpen: Story = {
	args: {
		isMobile: false,
		drawerOpen: true,
	},
};

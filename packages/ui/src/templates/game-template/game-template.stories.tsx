import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { View } from "react-native";

import { Text } from "../../atoms/text";
import { GameTemplate } from "./game-template";
import type {
	GameDestination,
	GameRightDestination,
	GameTemplateProps,
} from "./game-template.types";

function Placeholder({ label }: { label: string }) {
	return (
		<View className="p-4">
			<Text className="text-sm text-muted-foreground">{label}</Text>
		</View>
	);
}

function GameTemplatePlayground(args: Partial<GameTemplateProps> & { isMobile: boolean }) {
	const [destination, setDestination] = useState<GameDestination>("projects");
	const [projectsOpen, setProjectsOpen] = useState(true);
	const [rightDestination, setRightDestination] = useState<GameRightDestination>(null);
	const [activityOpen, setActivityOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [projectsWidth, setProjectsWidth] = useState(220);
	const [rightWidth, setRightWidth] = useState(260);

	return (
		<View className="h-[100vh]">
			<GameTemplate
				accountControl={
					<Text
						accessibilityRole="button"
						className="px-3 py-2 text-sm"
						onPress={() => {
							setAccountOpen(true);
						}}
					>
						Operator
					</Text>
				}
				accountOpen={accountOpen}
				accountOverlay={<Placeholder label="Settings and Sign out" />}
				activityOpen={activityOpen}
				activityOverlay={<Placeholder label="Event history" />}
				centerContent={<Placeholder label="Project workspace" />}
				centerKind="project"
				clockControls={<Text className="px-3 font-mono text-xs">Sep 11 · 1×</Text>}
				destination={destination}
				financesPanel={<Placeholder label="Business finances" />}
				inventoryPanel={<Placeholder label="Inventory" />}
				isMobile={args.isMobile}
				learningPanel={<Placeholder label="Learning" />}
				learningProgress={<Text className="text-xs text-muted-foreground">Learning idle</Text>}
				mobileProgressStrip={
					args.isMobile ? (
						<View className="border-t border-border px-4 py-2">
							<Text className="text-[10px] text-muted-foreground">Ops idle</Text>
						</View>
					) : null
				}
				objectDrawer={args.objectDrawer}
				onAccountOpenChange={setAccountOpen}
				onActivityOpenChange={setActivityOpen}
				onDestinationChange={setDestination}
				onNewProject={() => {
					setDestination("projects");
				}}
				onProjectsOpenChange={setProjectsOpen}
				onProjectsWidthChange={setProjectsWidth}
				onRightDestinationChange={setRightDestination}
				onRightWidthChange={setRightWidth}
				operationsProgress={<Text className="text-xs text-muted-foreground">No active tasks</Text>}
				projectsOpen={projectsOpen}
				projectsPanel={<Placeholder label="Projects list" />}
				projectsWidth={projectsWidth}
				rightDestination={rightDestination}
				rightWidth={rightWidth}
				statusMetrics={<Text className="px-3 font-mono text-sm text-primary">CASH ♦500</Text>}
			/>
		</View>
	);
}

const meta: Meta<typeof GameTemplatePlayground> = {
	title: "Templates/GameTemplate",
	component: GameTemplatePlayground,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Desktop rails and mobile destinations around the same slotted sections. Business state stays in the parent.",
			},
		},
	},
	tags: ["autodocs"],
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
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

export const EmptyCenter: Story = {
	args: {
		isMobile: false,
	},
	render: () => (
		<View className="h-[100vh]">
			<GameTemplate
				accountControl={<Text className="px-3">Operator</Text>}
				accountOpen={false}
				accountOverlay={<Placeholder label="Account" />}
				activityOpen={false}
				activityOverlay={<Placeholder label="Activity" />}
				centerContent={<Placeholder label="No active project" />}
				centerKind="empty"
				clockControls={<Text className="px-3">clock</Text>}
				destination="projects"
				financesPanel={<Placeholder label="Finances" />}
				inventoryPanel={<Placeholder label="Inventory" />}
				isMobile={false}
				learningPanel={<Placeholder label="Learning" />}
				learningProgress={<Text>learn</Text>}
				objectDrawer={undefined}
				onAccountOpenChange={() => undefined}
				onActivityOpenChange={() => undefined}
				onDestinationChange={() => undefined}
				onNewProject={() => undefined}
				onProjectsOpenChange={() => undefined}
				onProjectsWidthChange={() => undefined}
				onRightDestinationChange={() => undefined}
				onRightWidthChange={() => undefined}
				operationsProgress={<Text>ops</Text>}
				projectsOpen
				projectsPanel={<Placeholder label="Projects list" />}
				projectsWidth={220}
				rightDestination={null}
				rightWidth={260}
				statusMetrics={<Text className="px-3">CASH</Text>}
			/>
		</View>
	),
};

export const DrawerOpen: Story = {
	args: {
		isMobile: false,
		objectDrawer: (
			<View className="absolute inset-x-0 bottom-0 border-t border-border bg-hud p-4">
				<Text>Object details</Text>
			</View>
		),
	},
};

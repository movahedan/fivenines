import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";

import { Text } from "../../atoms/text";
import { GameAccountControl } from "../game-account-control/game-account-control";
import { GameClockControls } from "../game-clock-controls/game-clock-controls";
import { GamePipelineChip } from "../game-pipeline-chip/game-pipeline-chip";
import { MetricStat } from "../metric-stat/metric-stat";
import { GameStatusBar } from "./game-status-bar";

const meta: Meta<typeof GameStatusBar> = {
	title: "Components/GameStatusBar",
	component: GameStatusBar,
	parameters: {
		layout: "fullscreen",
		controls: {
			exclude: [
				"leading",
				"metrics",
				"operationsProgress",
				"learningProgress",
				"clockControls",
				"trailing",
			],
		},
		docs: {
			description: {
				component:
					"Reusable game status bar. static sits in document flow; absolute sticks to the bottom of a relative parent.",
			},
		},
	},
	args: {
		leading: <GameAccountControl onPress={() => undefined} />,
		metrics: (
			<>
				<MetricStat label="CASH" tone="primary" value="♦500.00" />
				<MetricStat label="REP" value="0" />
				<MetricStat label="OPEX" value="♦8.90" />
			</>
		),
		clockControls: (
			<GameClockControls
				dateLabel="Sep 11, 2026"
				dayProgress={0.42}
				onSpeedChange={() => undefined}
				speed={1}
			/>
		),
		trailing: <Text className="text-lg text-muted-foreground">⌁</Text>,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
	args: {
		placement: "static",
	},
};

export const WithPipelines: Story = {
	args: {
		placement: "static",
		operationsProgress: (
			<GamePipelineChip detail="1h" label="App Runtime install" progress={55} tone="ops" />
		),
		learningProgress: (
			<GamePipelineChip detail="40%" label="Capacity planning" progress={40} tone="learn" />
		),
	},
};

export const Mobile: Story = {
	args: {
		placement: "static",
		density: "mobile",
		showTaskGroup: false,
		leading: <GameAccountControl compact onPress={() => undefined} />,
		metrics: (
			<>
				<MetricStat compact label="CASH" tone="primary" value="♦500" />
				<MetricStat compact label="REP" value="0" />
				<MetricStat compact label="OPEX" value="♦9" />
			</>
		),
		clockControls: (
			<GameClockControls
				dateLabel="Sep 11, 2026"
				dayProgress={0.42}
				density="mobile"
				onSpeedChange={() => undefined}
				speed={1}
			/>
		),
	},
};

export const Absolute: Story = {
	args: {
		placement: "absolute",
	},
	decorators: [
		(Story) => (
			<View className="bg-background" style={{ position: "relative", height: 192 }}>
				<Text className="p-4 text-sm text-muted-foreground">Parent content</Text>
				<Story />
			</View>
		),
	],
};

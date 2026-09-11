import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";

import { Text } from "../../atoms/text";
import { GameStatusBar } from "./game-status-bar";

const meta: Meta<typeof GameStatusBar> = {
	title: "Components/GameStatusBar",
	component: GameStatusBar,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Reusable game status bar. static sits in document flow; absolute sticks to the bottom of a relative parent.",
			},
		},
	},
	args: {
		metrics: <Text className="px-3 font-mono text-sm text-primary">CASH ♦500</Text>,
		operationsProgress: <Text className="text-xs text-muted-foreground">No active tasks</Text>,
		clockControls: <Text className="px-3 font-mono text-xs">Sep 11</Text>,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
	args: {
		placement: "static",
	},
};

export const Absolute: Story = {
	args: {
		placement: "absolute",
	},
	decorators: [
		(Story) => (
			<View className="relative h-48 bg-background">
				<Text className="p-4 text-sm text-muted-foreground">Parent content</Text>
				<Story />
			</View>
		),
	],
};

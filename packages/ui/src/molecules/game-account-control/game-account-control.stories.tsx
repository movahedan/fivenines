import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";

import { GameAccountControl } from "./game-account-control";

const meta: Meta<typeof GameAccountControl> = {
	title: "Components/GameAccountControl",
	component: GameAccountControl,
	parameters: {
		layout: "centered",
	},
	args: {
		onPress: () => undefined,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	decorators: [
		(Story) => (
			<View className="h-11 border border-border bg-hud">
				<Story />
			</View>
		),
	],
};

export const Compact: Story = {
	args: {
		compact: true,
	},
	decorators: [
		(Story) => (
			<View className="h-14 border border-border bg-hud">
				<Story />
			</View>
		),
	],
};

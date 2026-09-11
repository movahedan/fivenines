import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";

import { GamePipelineChip } from "./game-pipeline-chip";

const meta: Meta<typeof GamePipelineChip> = {
	title: "Components/GamePipelineChip",
	component: GamePipelineChip,
	parameters: {
		layout: "centered",
	},
	args: {
		label: "Install Application Runtime",
		detail: "2h",
		progress: 25,
		tone: "ops",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Ops: Story = {};

export const Learn: Story = {
	args: {
		label: "Capacity planning",
		detail: "40%",
		progress: 40,
		tone: "learn",
	},
};

export const Flush: Story = {
	args: {
		flush: true,
		label: "Install Application Runtime",
		detail: "2h",
		progress: 25,
		tone: "ops",
	},
	decorators: [
		(Story) => (
			<View className="w-80 border border-border bg-hud">
				<Story />
			</View>
		),
	],
};

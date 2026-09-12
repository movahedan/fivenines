import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";

import { GameLearningPanel } from "./game-learning-panel";

const meta: Meta<typeof GameLearningPanel> = {
	title: "Components/GameLearningPanel",
	component: GameLearningPanel,
	parameters: {
		layout: "fullscreen",
	},
	args: {
		onStartResearch: () => undefined,
		onEnrollCourse: () => undefined,
		onPause: () => undefined,
		onResume: () => undefined,
		ongoing: [],
		technologies: [
			{
				id: "application-runtime",
				name: "Application Runtime",
				family: "Application",
				status: "completed",
				description: "Runs web application processes.",
				requires: [],
			},
			{
				id: "monitoring",
				name: "Monitoring",
				family: "Observability",
				status: "available",
				description: "Collects per-component metrics.",
				requires: ["Application Runtime"],
				researchHours: 168,
				tuitionLabel: "$40.00/mo",
			},
			{
				id: "health-checks",
				name: "Health Checks",
				family: "Observability",
				status: "locked",
				description: "Prerequisites not completed.",
				requires: ["Monitoring", "Load Balancing"],
				researchHours: 504,
				tuitionLabel: "$160.00/mo",
			},
		],
		courses: [
			{
				id: "system-administration",
				name: "System Administration",
				mark: "SY",
				status: "available",
				currentLevel: 0,
				maxLevel: 5,
				effect: "configurationIncidentProbability",
				tuitionLabel: "$20.00/mo",
				durationLabel: "1w",
			},
			{
				id: "deployment-automation",
				name: "Deployment Automation",
				mark: "DE",
				status: "active",
				currentLevel: 0,
				maxLevel: 5,
				effect: "installationAndConfigurationWork",
				tuitionLabel: "$20.00/mo",
				durationLabel: "1w",
				enrollmentId: "enroll-1",
			},
		],
	},
	decorators: [
		(Story) => (
			<View className="h-[640px] w-[320px] border border-border bg-background">
				<Story />
			</View>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {};

export const Studying: Story = {
	args: {
		ongoing: [
			{
				id: "deployment-automation",
				name: "Deployment Automation",
				detail: "Level 0",
				mark: "DE",
			},
		],
	},
};

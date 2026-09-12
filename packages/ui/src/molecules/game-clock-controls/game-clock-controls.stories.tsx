import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { View } from "react-native";

import { cn } from "@/utils";
import {
	GameClockControls,
	type GameClockDensity,
	type GameClockSpeed,
} from "./game-clock-controls";

function ClockPlayground({
	dateLabel,
	dayProgress,
	speed: initialSpeed,
	density = "desktop",
}: {
	dateLabel: string;
	dayProgress: number;
	speed: GameClockSpeed;
	density?: GameClockDensity;
}) {
	const [speed, setSpeed] = useState<GameClockSpeed>(initialSpeed);

	return (
		<View
			className={cn(
				"items-stretch border border-border bg-hud",
				density === "mobile" && "self-start",
			)}
			style={{ height: density === "mobile" ? 56 : 44 }}
		>
			<GameClockControls
				dateLabel={dateLabel}
				dayProgress={dayProgress}
				density={density}
				onSpeedChange={setSpeed}
				speed={speed}
			/>
		</View>
	);
}

const meta: Meta<typeof ClockPlayground> = {
	title: "Components/GameClockControls",
	component: ClockPlayground,
	parameters: {
		layout: "centered",
		controls: {
			include: ["dateLabel", "dayProgress", "speed", "density"],
		},
		docs: {
			description: {
				component:
					"Presentational sim date, day-progress bar, and pause/speed cluster for the game status bar. Not a calendar date picker.",
			},
		},
	},
	args: {
		dateLabel: "Sep 11, 2026",
		dayProgress: 0.42,
		speed: 1,
		density: "desktop",
	},
	argTypes: {
		dayProgress: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
		speed: { control: { type: "inline-radio" }, options: [0, 1, 2, 4] },
		dateLabel: { control: "text" },
		density: { control: "inline-radio", options: ["desktop", "mobile"] },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Paused: Story = {
	args: {
		speed: 0,
		dayProgress: 0.1,
	},
};

export const Mobile: Story = {
	args: {
		density: "mobile",
	},
};

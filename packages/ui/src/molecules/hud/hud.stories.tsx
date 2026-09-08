import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "../../atoms/text";
import { Hud } from "./hud";

const meta: Meta<typeof Hud> = {
	title: "Components/Hud",
	component: Hud,
	parameters: {
		layout: "fullscreen",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component:
					"Ops HUD with logo, tick clock, metrics, play/pause icon, ×1/×2/×4 speed, jail, and account slot.",
			},
		},
	},
	args: {
		title: "Five Nines",
		subtitle: "Opening Shift",
		tickLabel: "W1 T04",
		clockLabel: "00:12:00",
		metrics: [
			{ label: "CASH", value: "$12,400", tone: "primary" },
			{ label: "Receivable today", value: "$800", tone: "info" },
			{ label: "OPEX / hour", value: "$42", tone: "default" },
		],
		running: true,
		speed: 1,
		onToggleRunning: () => undefined,
		onSpeedChange: () => undefined,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Jailed: Story = {
	args: {
		running: false,
		jailed: true,
		account: <Text className="text-xs text-muted-foreground">ops@five</Text>,
	},
};

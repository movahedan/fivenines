import type { Meta, StoryObj } from "@storybook/react";

import { ServerCard } from "./server-card";

const meta: Meta<typeof ServerCard> = {
	title: "Components/ServerCard",
	component: ServerCard,
	parameters: {
		layout: "centered",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component: "Fleet or market server card with util blocks or a buy action.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Fleet: Story = {
	args: {
		variant: "fleet",
		label: "m5.large",
		idLabel: "#A1F2",
		cpuLabel: "CPU 3/8",
		opexLabel: "opex -$4/hr",
		utilPercent: 38,
		utilTone: "primary",
		onSell: () => undefined,
		className: "w-80",
	},
};

export const FleetHot: Story = {
	args: {
		...Fleet.args,
		cpuLabel: "CPU 8/8",
		utilPercent: 96,
		utilTone: "destructive",
	},
};

export const Market: Story = {
	args: {
		variant: "market",
		label: "m5.xlarge",
		cpuLabel: "8 cores",
		ramLabel: "16 GB",
		opexLabel: "-$8/hr",
		costLabel: "$800",
		canAfford: true,
		onBuy: () => undefined,
		className: "w-80",
	},
};

export const Unaffordable: Story = {
	args: {
		...Market.args,
		canAfford: false,
	},
};

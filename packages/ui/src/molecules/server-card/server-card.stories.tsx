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
				component: "Fleet or market server card with CPU/NET/RAM bars or a buy action.",
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
		cpuLabel: "1000 cu",
		netLabel: "1000000 B/h",
		ramLabel: "4096 MiB",
		opexLabel: "opex -$4/hr",
		cpuPercent: 38,
		netPercent: 12,
		ramPercent: 8,
		onSell: () => undefined,
		className: "w-80",
	},
};

export const FleetHot: Story = {
	args: {
		...Fleet.args,
		cpuLabel: "1000 cu",
		cpuPercent: 96,
		netPercent: 40,
		ramPercent: 22,
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

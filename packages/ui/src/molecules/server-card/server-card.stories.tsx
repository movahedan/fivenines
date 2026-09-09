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
		cpuLabel: "1000 cores",
		netLabel: "1000000 B/h",
		ramLabel: "4096 MiB",
		opexLabel: "opex -$4/hr",
		cpuPercent: 38,
		netPercent: 12,
		ramPercent: 8,
		onSell: () => undefined,
		dotClassName: "bg-info shadow-glow-info",
		className: "w-80",
	},
};

export const FleetHot: Story = {
	args: {
		...Fleet.args,
		cpuLabel: "1000 cores",
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
		canAffordLease: true,
		leaseLabel: "$1.47/h rent",
		onBuy: () => undefined,
		onLease: () => undefined,
		dotClassName: "bg-warning shadow-glow-warning",
		className: "w-80",
	},
};

export const Unaffordable: Story = {
	args: {
		...Market.args,
		canAfford: false,
	},
};

export const FleetOutage: Story = {
	args: {
		...Fleet.args,
		healthLabel: "DEGRADED",
		onRepair: () => undefined,
		onInstallMonitoring: () => undefined,
	},
};

export const FleetRelease: Story = {
	args: {
		...Fleet.args,
		idLabel: "server-1 · leased",
		onSell: undefined,
		onRelease: () => undefined,
	},
};

export const LeaseJailed: Story = {
	args: {
		...Market.args,
		canAfford: false,
		canAffordLease: false,
	},
};

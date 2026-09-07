import type { Meta, StoryObj } from "@storybook/react";

import { ActiveProjectCard } from "./active-project-card";

const SPARKLINE = [0.82, 0.9, 0.74, 0.88, 0.41, 0.93, 0.86, 0.91];

const meta: Meta<typeof ActiveProjectCard> = {
	title: "Components/ActiveProjectCard",
	component: ActiveProjectCard,
	parameters: {
		layout: "centered",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component: "Active project card with SLA bar and sparkline.",
			},
		},
	},
	args: {
		customerName: "ACME CORP",
		name: "web-prod",
		regionLabel: "UTC-8",
		regionClassName: "text-info",
		slaLabel: "99.95%",
		slaStatusLabel: "OK",
		slaTone: "sla",
		slaPercent: 82,
		currentHourLabel: "100%",
		rollingLabel: "99.95%",
		targetLabel: "99.00%",
		recoveryEtaLabel: "31 healthy hours",
		sparkline: SPARKLINE,
		sparklineTarget: 0.99,
		serverLabel: "m5.large #A1F2",
		paygLabel: "$1,240",
		className: "w-80",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Warning: Story = {
	args: {
		slaTone: "warning",
		slaStatusLabel: "AT RISK",
		slaPercent: 54,
	},
};

export const Warming: Story = {
	args: {
		sparkline: [],
		sparklineWarmingLabel: "WARMING UP...",
	},
};

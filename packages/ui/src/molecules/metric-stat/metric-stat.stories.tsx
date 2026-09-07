import type { Meta, StoryObj } from "@storybook/react";

import { MetricStat } from "./metric-stat";

const meta: Meta<typeof MetricStat> = {
	title: "Components/MetricStat",
	component: MetricStat,
	parameters: {
		layout: "centered",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component: "Stacked ops metric with a muted label and a toned value.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "CASH",
		value: "$12,400",
		tone: "default",
	},
};

export const Primary: Story = {
	args: {
		label: "PPM",
		value: "4.2",
		tone: "primary",
	},
};

export const Warning: Story = {
	args: {
		label: "SLA",
		value: "99.2%",
		tone: "warning",
	},
};

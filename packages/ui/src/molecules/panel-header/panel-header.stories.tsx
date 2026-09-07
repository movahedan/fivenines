import type { Meta, StoryObj } from "@storybook/react";

import { PanelHeader } from "./panel-header";

const meta: Meta<typeof PanelHeader> = {
	title: "Components/PanelHeader",
	component: PanelHeader,
	parameters: {
		layout: "fullscreen",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component: "Ops panel chrome with a tone dot, uppercase label, and optional count.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "Queue",
		tone: "primary",
	},
};

export const WithCount: Story = {
	args: {
		label: "Fleet",
		count: 4,
		tone: "info",
	},
};

export const Warning: Story = {
	args: {
		label: "Incidents",
		count: 2,
		tone: "warning",
	},
};

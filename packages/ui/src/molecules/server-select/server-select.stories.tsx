import type { Meta, StoryObj } from "@storybook/react";

import { ServerSelect } from "./server-select";

const SERVER_OPTIONS = [
	{ id: "srv-a", label: "m5.large #A1F2" },
	{ id: "srv-b", label: "c5.xlarge #B7C3" },
];

const meta: Meta<typeof ServerSelect> = {
	title: "Components/ServerSelect",
	component: ServerSelect,
	parameters: {
		layout: "centered",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component: "Labelled server picker used by the offer and active project cards.",
			},
		},
	},
	args: {
		label: "Server",
		options: SERVER_OPTIONS,
		onSelect: () => undefined,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
	args: {
		selectedId: "srv-b",
	},
};

export const Empty: Story = {
	args: {
		options: [],
		emptyLabel: "No servers",
	},
};

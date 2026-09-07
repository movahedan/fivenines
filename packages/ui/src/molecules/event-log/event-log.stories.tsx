import type { Meta, StoryObj } from "@storybook/react";

import { EventLog } from "./event-log";

const meta: Meta<typeof EventLog> = {
	title: "Components/EventLog",
	component: EventLog,
	parameters: {
		layout: "fullscreen",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component: "Scrollable ops event stream with tick prefixes and tone colors.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		entries: [
			{
				id: "1",
				tickLabel: "W1 T04",
				message: "Opening shift started",
				tone: "info",
			},
			{
				id: "2",
				tickLabel: "W1 T12",
				message: "Offer accepted: acme-web",
				tone: "success",
			},
			{
				id: "3",
				tickLabel: "W1 T18",
				message: "SLA drifting on rack-2",
				tone: "warn",
			},
			{
				id: "4",
				tickLabel: "W1 T22",
				message: "Region outage: utc-8",
				tone: "danger",
			},
		],
		className: "h-64",
	},
};

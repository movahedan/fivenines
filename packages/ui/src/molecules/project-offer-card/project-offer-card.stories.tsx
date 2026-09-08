import type { Meta, StoryObj } from "@storybook/react";

import { ProjectOfferCard } from "./project-offer-card";

const SERVER_OPTIONS = [
	{ id: "srv-a", label: "m5.large #A1F2" },
	{ id: "srv-b", label: "c5.xlarge #B7C3" },
];

const meta: Meta<typeof ProjectOfferCard> = {
	title: "Components/ProjectOfferCard",
	component: ProjectOfferCard,
	parameters: {
		layout: "centered",
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				component: "Queue offer card with region chip, metrics, and accept or decline.",
			},
		},
	},
	args: {
		customerName: "ACME CORP",
		name: "web-prod",
		regionLabel: "UTC-8",
		regionClassName: "text-info",
		cpuLabel: "4c",
		paygLabel: "$12/hr",
		slaLabel: "99.90%",
		onAccept: () => undefined,
		onDecline: () => undefined,
		className: "w-80",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const WithServerSelected: Story = {
	args: {
		serverOptions: SERVER_OPTIONS,
		selectedServerId: "srv-a",
		onSelectServer: () => undefined,
	},
};

export const NoServers: Story = {
	args: {
		serverOptions: [],
	},
};

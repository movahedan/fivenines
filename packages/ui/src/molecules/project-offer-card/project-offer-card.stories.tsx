import type { Meta, StoryObj } from "@storybook/react";

import { ProjectOfferCard } from "./project-offer-card";

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

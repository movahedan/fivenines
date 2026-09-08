import type { Meta, StoryObj } from "@storybook/react";

import { SelectField } from "./select-field";

const OPTIONS = [
	{ value: "server-1", label: "server-1 · Bronze · utc+0" },
	{ value: "server-2", label: "server-2 · Silver · utc+1" },
	{ value: "server-3", label: "server-3 · Gold · utc-5" },
];

const meta: Meta<typeof SelectField> = {
	title: "Components/SelectField",
	component: SelectField,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Compact inline picker for ops chrome. Renders a real `<select>` on web so it stays keyboard and screen-reader native; on native it degrades to a read-only label and value.",
			},
		},
	},
	argTypes: {
		label: {
			control: { type: "text" },
			description: "Visible label bound to the control",
		},
		value: {
			control: { type: "text" },
			description: "Selected option value; a blank placeholder shows while undefined",
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "Server",
		options: OPTIONS,
		value: "server-1",
	},
};

export const Unselected: Story = {
	args: {
		label: "Server",
		options: OPTIONS,
	},
};

export const SingleOption: Story = {
	args: {
		label: "Server",
		options: [OPTIONS[0] ?? { value: "server-1", label: "server-1" }],
		value: "server-1",
	},
};

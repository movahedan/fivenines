import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { SelectField } from "./select-field";

const OPTIONS = [
	{ value: "server-1", label: "server-1 · Bronze" },
	{ value: "server-2", label: "server-2 · Silver" },
];

describe("SelectField", () => {
	it("binds the label to the control so it is reachable by name", () => {
		render(<SelectField label="Server" options={OPTIONS} />);

		expect(screen.getByLabelText("Server")).toBe(screen.getByRole("combobox"));
	});

	it("renders one option per entry", () => {
		render(<SelectField label="Server" options={OPTIONS} value="server-1" />);

		expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
		expect(screen.getByRole("option", { name: "server-1 · Bronze" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "server-2 · Silver" })).toBeInTheDocument();
	});

	it("reports the chosen value on change", () => {
		const onValueChange = mock();

		render(<SelectField label="Server" onValueChange={onValueChange} options={OPTIONS} />);

		fireEvent.change(screen.getByLabelText("Server"), { target: { value: "server-2" } });

		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("server-2");
	});

	it("adds a blank placeholder option only while value is undefined", () => {
		const { unmount } = render(<SelectField label="Server" options={OPTIONS} />);

		expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length + 1);

		unmount();

		render(<SelectField label="Server" options={OPTIONS} value="server-1" />);

		expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
	});

	it("does not throw when no change handler is given", () => {
		render(<SelectField label="Server" options={OPTIONS} value="server-1" />);

		expect(() => {
			fireEvent.change(screen.getByLabelText("Server"), { target: { value: "server-2" } });
		}).not.toThrow();
	});
});

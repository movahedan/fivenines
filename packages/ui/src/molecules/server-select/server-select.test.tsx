import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { ServerSelect } from "./server-select";

const SERVER_OPTIONS = [
	{ id: "srv-a", label: "m5.large #A1F2" },
	{ id: "srv-b", label: "c5.xlarge #B7C3" },
] as const;

describe("ServerSelect", () => {
	it("renders a labelled select with one option per entry", () => {
		render(<ServerSelect label="Server" options={SERVER_OPTIONS} />);

		expect(screen.getByLabelText("Server")).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "m5.large #A1F2" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "c5.xlarge #B7C3" })).toBeInTheDocument();
	});

	it("calls onSelect with the chosen id when the select changes", () => {
		const onSelect = mock();

		render(<ServerSelect label="Server" onSelect={onSelect} options={SERVER_OPTIONS} />);

		fireEvent.change(screen.getByLabelText("Server"), { target: { value: "srv-b" } });

		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect).toHaveBeenCalledWith("srv-b");
	});

	it("renders emptyLabel instead of the select when options is empty", () => {
		render(<ServerSelect emptyLabel="No servers" label="Server" options={[]} />);

		expect(screen.getByText("No servers")).toBeInTheDocument();
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("renders nothing when options is empty and no emptyLabel is given", () => {
		const { container } = render(<ServerSelect label="Server" options={[]} />);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders the placeholder option only while selectedId is undefined", () => {
		const { unmount } = render(<ServerSelect label="Server" options={SERVER_OPTIONS} />);

		expect(screen.getAllByRole("option")).toHaveLength(SERVER_OPTIONS.length + 1);

		unmount();

		render(<ServerSelect label="Server" options={SERVER_OPTIONS} selectedId="srv-a" />);

		expect(screen.getAllByRole("option")).toHaveLength(SERVER_OPTIONS.length);
	});
});

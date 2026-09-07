import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { Text } from "../../atoms/text";
import { PanelHeader } from "./panel-header";

describe("PanelHeader", () => {
	it("renders the label when given a title", () => {
		render(<PanelHeader label="Queue" />);

		expect(screen.getByText("Queue")).toBeInTheDocument();
	});

	it("renders the count beside the label when count is set", () => {
		render(<PanelHeader label="Fleet" count={3} />);

		expect(screen.getByText("Fleet (3)")).toBeInTheDocument();
	});

	it("renders trailing content when provided", () => {
		render(<PanelHeader label="Market" trailing={<Text>filter</Text>} />);

		expect(screen.getByText("Market")).toBeInTheDocument();
		expect(screen.getByText("filter")).toBeInTheDocument();
	});
});

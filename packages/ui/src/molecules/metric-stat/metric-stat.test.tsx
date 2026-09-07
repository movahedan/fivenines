import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { MetricStat } from "./metric-stat";

describe("MetricStat", () => {
	it("renders label and value when given props", () => {
		render(<MetricStat label="CASH" value="$12,400" />);

		expect(screen.getByText("CASH")).toBeInTheDocument();
		expect(screen.getByText("$12,400")).toBeInTheDocument();
	});

	it("renders the value when a warning tone is set", () => {
		render(<MetricStat label="SLA" value="99.2%" tone="warning" />);

		expect(screen.getByText("SLA")).toBeInTheDocument();
		expect(screen.getByText("99.2%")).toBeInTheDocument();
	});
});

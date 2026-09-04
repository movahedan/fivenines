import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { HomeStatus } from "./home-status";

describe("HomeStatus - api status", () => {
	it("shows unreachable copy when health is missing", () => {
		render(<HomeStatus ok={null} />);

		expect(screen.getByText("Control plane unreachable")).toBeTruthy();
	});

	it("shows ok when health succeeded", () => {
		render(<HomeStatus ok={true} service="nestjs" />);

		expect(screen.getByText("nestjs")).toBeTruthy();
		expect(screen.getByText("ok")).toBeTruthy();
	});
});

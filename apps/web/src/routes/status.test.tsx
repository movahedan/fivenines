import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";

import { render, screen } from "@testing-library/react";

import { StatusPage } from "./status";

const ISO = "2026-09-05T02:22:00.000Z";

describe("StatusPage - process up", () => {
	afterEach(() => {
		mock.restore();
	});

	it("shows ok and an ISO timestamp when the process is up", () => {
		spyOn(Date.prototype, "toISOString").mockReturnValue(ISO);

		render(<StatusPage />);

		expect(screen.getByRole("main")).toBeTruthy();
		expect(screen.getByRole("heading", { level: 1, name: "ok" })).toBeTruthy();

		const stamped = screen.getByText(ISO);
		expect(stamped.tagName).toBe("TIME");
		expect(stamped.getAttribute("dateTime")).toBe(ISO);
	});
});

import { describe, expect, it } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { HomePage } from "./index";

describe("HomePage", () => {
	it("sends Play to the hub", () => {
		render(<HomePage />);
		const play = screen.getAllByRole("link", { name: "Play" })[0];
		expect(play?.getAttribute("href")).toBe("/hub");
	});

	it("opens an FAQ answer without leaving the page", () => {
		render(<HomePage />);
		fireEvent.click(screen.getByText("What is Five Nines?"));
		expect(screen.getByText(/the wiki is the product pitch/i)).toBeTruthy();
	});
});

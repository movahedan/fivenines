import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { PlayButton } from "./play-button";

describe("PlayButton - hub entry", () => {
	it("always links to the guarded hub", () => {
		render(<PlayButton />);

		expect(screen.getByRole("link", { name: "Play" }).getAttribute("href")).toBe("/hub");
	});
});

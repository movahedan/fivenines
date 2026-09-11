import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { GameAccountControl } from "./game-account-control";

describe("GameAccountControl", () => {
	it("renders the operator name and email when the control is expanded", () => {
		render(<GameAccountControl onPress={mock()} />);

		expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
		expect(screen.getByText("Operator")).toBeInTheDocument();
		expect(screen.getByText("ops@fivenines.io")).toBeInTheDocument();
	});

	it("hides the name and email when the control is compact", () => {
		render(<GameAccountControl compact onPress={mock()} />);

		expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
		expect(screen.queryByText("Operator")).not.toBeInTheDocument();
		expect(screen.queryByText("ops@fivenines.io")).not.toBeInTheDocument();
	});

	it("calls onPress when the account control is pressed", () => {
		const onPress = mock();

		render(<GameAccountControl onPress={onPress} />);
		fireEvent.click(screen.getByRole("button", { name: "Account" }));

		expect(onPress).toHaveBeenCalledTimes(1);
	});
});

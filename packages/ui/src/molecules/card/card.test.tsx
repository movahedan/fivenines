import { describe, expect, it } from "bun:test";

import { render, screen } from "@testing-library/react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

describe("Card Components", () => {
	it("renders Card component", () => {
		render(<Card testID="card">Card content</Card>);
		expect(screen.getByTestId("card")).toBeInTheDocument();
		expect(screen.getByText("Card content")).toBeInTheDocument();
	});

	it("renders Card with custom className", () => {
		render(
			<Card className="custom-class" testID="card">
				Card content
			</Card>,
		);
		expect(screen.getByTestId("card")).toBeInTheDocument();
	});

	it("renders CardHeader component", () => {
		render(<CardHeader testID="card-header">Header content</CardHeader>);
		expect(screen.getByTestId("card-header")).toBeInTheDocument();
		expect(screen.getByText("Header content")).toBeInTheDocument();
	});

	it("renders CardHeader with custom className", () => {
		render(
			<CardHeader className="custom-header" testID="card-header">
				Header content
			</CardHeader>,
		);
		expect(screen.getByTestId("card-header")).toBeInTheDocument();
	});

	it("renders CardTitle component", () => {
		render(<CardTitle testID="card-title">Card Title</CardTitle>);
		expect(screen.getByTestId("card-title")).toBeInTheDocument();
		expect(screen.getByText("Card Title")).toBeInTheDocument();
	});

	it("renders CardTitle with custom className", () => {
		render(
			<CardTitle className="custom-title" testID="card-title">
				Card Title
			</CardTitle>,
		);
		expect(screen.getByTestId("card-title")).toBeInTheDocument();
	});

	it("renders CardDescription component", () => {
		render(<CardDescription testID="card-description">Card description</CardDescription>);
		expect(screen.getByTestId("card-description")).toBeInTheDocument();
		expect(screen.getByText("Card description")).toBeInTheDocument();
	});

	it("renders CardDescription with custom className", () => {
		render(
			<CardDescription className="custom-description" testID="card-description">
				Card description
			</CardDescription>,
		);
		expect(screen.getByTestId("card-description")).toBeInTheDocument();
	});

	it("renders CardContent component", () => {
		render(<CardContent testID="card-content">Card content</CardContent>);
		expect(screen.getByTestId("card-content")).toBeInTheDocument();
		expect(screen.getByText("Card content")).toBeInTheDocument();
	});

	it("renders CardContent with custom className", () => {
		render(
			<CardContent className="custom-content" testID="card-content">
				Card content
			</CardContent>,
		);
		expect(screen.getByTestId("card-content")).toBeInTheDocument();
	});

	it("renders CardFooter component", () => {
		render(<CardFooter testID="card-footer">Footer content</CardFooter>);
		expect(screen.getByTestId("card-footer")).toBeInTheDocument();
		expect(screen.getByText("Footer content")).toBeInTheDocument();
	});

	it("renders CardFooter with custom className", () => {
		render(
			<CardFooter className="custom-footer" testID="card-footer">
				Footer content
			</CardFooter>,
		);
		expect(screen.getByTestId("card-footer")).toBeInTheDocument();
	});

	it("renders complete Card with all subcomponents", () => {
		render(
			<Card testID="complete-card">
				<CardHeader>
					<CardTitle>Complete Card</CardTitle>
					<CardDescription>This is a complete card example</CardDescription>
				</CardHeader>
				<CardContent>
					<p>This is the main content of the card.</p>
				</CardContent>
				<CardFooter>
					<button type="button">Action</button>
				</CardFooter>
			</Card>,
		);

		expect(screen.getByTestId("complete-card")).toBeInTheDocument();
		expect(screen.getByText("Complete Card")).toBeInTheDocument();
		expect(screen.getByText("This is a complete card example")).toBeInTheDocument();
		expect(screen.getByText("This is the main content of the card.")).toBeInTheDocument();
		expect(screen.getByText("Action")).toBeInTheDocument();
	});

	it("forwards additional props", () => {
		render(
			<Card testID="card-with-props" aria-label="Card label">
				Card with props
			</Card>,
		);
		expect(screen.getByLabelText("Card label")).toBeInTheDocument();
	});
});

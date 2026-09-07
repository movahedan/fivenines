import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { ServerCard } from "./server-card";

describe("ServerCard", () => {
	it("renders fleet labels and calls onSell when SELL is pressed", () => {
		const onSell = mock();

		render(
			<ServerCard
				cpuLabel="CPU 2/8"
				idLabel="#A1F2"
				label="m5.large"
				onSell={onSell}
				opexLabel="opex -$4/hr"
				utilPercent={40}
				variant="fleet"
			/>,
		);

		expect(screen.getByText("m5.large")).toBeInTheDocument();
		expect(screen.getByText("#A1F2")).toBeInTheDocument();
		expect(screen.getByText("CPU 2/8")).toBeInTheDocument();
		expect(screen.getByText("opex -$4/hr")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "SELL" }));

		expect(onSell).toHaveBeenCalledTimes(1);
	});

	it("renders market metrics and calls onBuy when BUY is pressed", () => {
		const onBuy = mock();

		render(
			<ServerCard
				canAfford
				costLabel="$800"
				cpuLabel="8 cores"
				label="m5.xlarge"
				onBuy={onBuy}
				opexLabel="-$8/hr"
				ramLabel="16 GB"
				variant="market"
			/>,
		);

		expect(screen.getByText("m5.xlarge")).toBeInTheDocument();
		expect(screen.getByText("$800")).toBeInTheDocument();
		expect(screen.getByText("-$8/hr")).toBeInTheDocument();
		expect(screen.getByText("8 cores")).toBeInTheDocument();
		expect(screen.getByText("16 GB")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "BUY" }));

		expect(onBuy).toHaveBeenCalledTimes(1);
	});

	it("disables BUY when canAfford is false", () => {
		const onBuy = mock();

		render(
			<ServerCard
				canAfford={false}
				costLabel="$800"
				cpuLabel="8 cores"
				label="m5.xlarge"
				onBuy={onBuy}
				opexLabel="-$8/hr"
				variant="market"
			/>,
		);

		expect(screen.getByRole("button", { name: "BUY" })).toBeDisabled();

		fireEvent.click(screen.getByRole("button", { name: "BUY" }));

		expect(onBuy).not.toHaveBeenCalled();
	});
});

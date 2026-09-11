import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render, screen } from "@testing-library/react";

import { ServerCard } from "./server-card";

describe("ServerCard", () => {
	it("renders fleet labels and calls onSell when SELL is pressed", () => {
		const onSell = mock();

		render(
			<ServerCard
				cpuLabel="1000 cores"
				cpuPercent={40}
				idLabel="#A1F2"
				label="m5.large"
				netLabel="1000000 B/h"
				netPercent={10}
				onSell={onSell}
				opexLabel="opex -$4/hr"
				ramLabel="4096 MiB"
				ramPercent={6}
				variant="fleet"
			/>,
		);

		expect(screen.getByText("m5.large")).toBeInTheDocument();
		expect(screen.getByText("#A1F2")).toBeInTheDocument();
		expect(screen.getByText("CPU")).toBeInTheDocument();
		expect(screen.getByText("NET")).toBeInTheDocument();
		expect(screen.getByText("RAM")).toBeInTheDocument();
		expect(screen.getByText("1000 cores")).toBeInTheDocument();
		expect(screen.getByText("1000000 B/h")).toBeInTheDocument();
		expect(screen.getByText("4096 MiB")).toBeInTheDocument();
		expect(screen.getByText("40%")).toBeInTheDocument();
		expect(screen.getByText("10%")).toBeInTheDocument();
		expect(screen.getByText("6%")).toBeInTheDocument();
		expect(screen.getByText("opex -$4/hr")).toBeInTheDocument();
		expect(screen.getByLabelText("SKU marker")).toBeInTheDocument();

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

	it("renders BUY and LEASE and calls each callback when pressed", () => {
		const onBuy = mock();
		const onLease = mock();

		render(
			<ServerCard
				canAfford
				canAffordLease
				costLabel="$800"
				cpuLabel="8 cores"
				label="m5.xlarge"
				leaseLabel="$1.47/h rent"
				onBuy={onBuy}
				onLease={onLease}
				opexLabel="-$8/hr"
				ramLabel="16 GB"
				variant="market"
			/>,
		);

		expect(screen.getByText("$1.47/h rent")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "BUY" }));
		fireEvent.click(screen.getByRole("button", { name: "LEASE" }));

		expect(onBuy).toHaveBeenCalledTimes(1);
		expect(onLease).toHaveBeenCalledTimes(1);
	});

	it("disables LEASE when canAffordLease is false", () => {
		const onLease = mock();

		render(
			<ServerCard
				canAfford
				canAffordLease={false}
				costLabel="$800"
				cpuLabel="8 cores"
				label="m5.xlarge"
				leaseLabel="$1.47/h rent"
				onBuy={() => undefined}
				onLease={onLease}
				opexLabel="-$8/hr"
				variant="market"
			/>,
		);

		expect(screen.getByRole("button", { name: "LEASE" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "BUY" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: "LEASE" }));

		expect(onLease).not.toHaveBeenCalled();
	});

	it("shows RELEASE instead of SELL when onRelease is passed", () => {
		const onRelease = mock();
		const onSell = mock();

		render(
			<ServerCard
				cpuLabel="1000 cores"
				idLabel="server-1 · leased"
				label="m5.large"
				onRelease={onRelease}
				onSell={onSell}
				opexLabel="opex -$4/hr"
				variant="fleet"
			/>,
		);

		expect(screen.queryByRole("button", { name: "SELL" })).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: "RELEASE" }));

		expect(onRelease).toHaveBeenCalledTimes(1);
		expect(onSell).not.toHaveBeenCalled();
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

	it("applies a custom SKU marker class when given", () => {
		render(
			<ServerCard
				cpuLabel="1000 cores"
				dotClassName="bg-warning shadow-glow-warning"
				label="m5.large"
				opexLabel="opex -$4/hr"
				variant="fleet"
			/>,
		);

		expect(screen.getByTestId("sku-marker-custom")).toBeInTheDocument();
	});

	it("shows disk and GPU comparison stats on the market card", () => {
		render(
			<ServerCard
				costLabel="$180"
				cpuLabel="1000 cores"
				diskLabel="65536 MiB"
				gpuLabel="none"
				label="Bronze"
				opexLabel="$1.15/h idle"
				ramLabel="4096 MiB"
				variant="market"
			/>,
		);

		expect(screen.getByText("DISK")).toBeInTheDocument();
		expect(screen.getByText("65536 MiB")).toBeInTheDocument();
		expect(screen.getByText("GPU")).toBeInTheDocument();
		expect(screen.getByText("none")).toBeInTheDocument();
	});

	it("shows a disk bar and GPU unavailable copy on the fleet card", () => {
		render(
			<ServerCard
				cpuLabel="1000 cores"
				diskLabel="65536 MiB"
				diskPercent={12}
				gpuUnavailableLabel="unavailable"
				label="Bronze"
				opexLabel="$1.15/h idle"
				variant="fleet"
			/>,
		);

		expect(screen.getByLabelText("DISK 12 percent")).toBeInTheDocument();
		expect(screen.getByLabelText("GPU unavailable")).toBeInTheDocument();
		expect(screen.queryByLabelText(/GPU \d+ percent/)).toBeNull();
	});
});

function cents(amount: number): string {
	const sign = amount < 0 ? "-" : "";
	const absolute = Math.abs(amount);
	const dollars = Math.floor(absolute / 100);
	const remainder = absolute % 100;

	return `${sign}$${String(dollars)}.${String(remainder).padStart(2, "0")}`;
}

function hourTick(hourIndex: number): string {
	return `T+${String(hourIndex).padStart(4, "0")}`;
}

function clockLabel(hourIndex: number): string {
	const dayIndex = Math.floor(hourIndex / 24);
	const hourOfDay = hourIndex % 24;

	return `D${String(dayIndex)} H${String(hourOfDay).padStart(2, "0")}`;
}

function ppm(value: number | null): string {
	return value === null ? "—" : `${String(value)} ppm`;
}

export const formatters = {
	cents,
	hourTick,
	clockLabel,
	ppm,
};

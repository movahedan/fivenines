function cents(amount: number): string {
	const sign = amount < 0 ? "-" : "";
	const absolute = Math.abs(amount);
	const dollars = Math.floor(absolute / 100);
	const remainder = absolute % 100;

	return `${sign}$${String(dollars)}.${String(remainder).padStart(2, "0")}`;
}

function hourTick(hourIndex: number): string {
	return `TICK ${String(hourIndex).padStart(4, "0")}`;
}

function clockLabel(hourIndex: number): string {
	const dayIndex = Math.floor(hourIndex / 24) + 1;
	const hourOfDay = hourIndex % 24;

	return `DAY ${String(dayIndex).padStart(2, "0")} · HR ${String(hourOfDay).padStart(2, "0")}:00`;
}

function ppm(value: number | null): string {
	return value === null ? "—" : `${(value / 10_000).toFixed(2)}%`;
}

function cores(count: number): string {
	return count === 1 ? "1 core" : `${String(count)} cores`;
}

function coresCompact(count: number): string {
	return `${String(count)}c`;
}

export const formatters = {
	cents,
	hourTick,
	clockLabel,
	ppm,
	cores,
	coresCompact,
};

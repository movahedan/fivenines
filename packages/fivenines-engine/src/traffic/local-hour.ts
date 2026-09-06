export function localHour(hourIndex: number, offsetHours: number): number {
	return (((hourIndex + offsetHours) % 24) + 24) % 24;
}

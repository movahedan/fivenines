export function localHour(hourIndex: number, timezoneHours: number): number {
	return (((hourIndex + timezoneHours) % 24) + 24) % 24;
}

export const SLA_WINDOW_HOURS = 168;

export function slaAvailabilityPpm(handled: number, emitted: number): number | null {
	if (emitted === 0) {
		return null;
	}

	return Math.floor((handled * 1_000_000) / emitted);
}

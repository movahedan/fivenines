export const SLA_WINDOW_HOURS = 168;

export function slaAvailabilityPpm(handled: number, emitted: number): number | null {
	if (emitted === 0) {
		return null;
	}

	return Math.floor((handled * 1_000_000) / emitted);
}

export function slaRecoveryHours(
	samples: readonly { handled: number; emitted: number }[],
	targetPpm: number,
): number | null {
	if (samples.length === 0) {
		return null;
	}

	const currentPpm = windowPpm(samples);

	if (currentPpm !== null && currentPpm >= targetPpm) {
		return null;
	}

	const last = samples[samples.length - 1];

	if (last === undefined) {
		return null;
	}

	const simulated = samples.slice();

	for (let hours = 1; hours <= SLA_WINDOW_HOURS; hours += 1) {
		simulated.push({ handled: last.emitted, emitted: last.emitted });

		if (simulated.length > SLA_WINDOW_HOURS) {
			simulated.shift();
		}

		const nextPpm = windowPpm(simulated);

		if (nextPpm !== null && nextPpm >= targetPpm) {
			return hours;
		}
	}

	return null;
}

function windowPpm(samples: readonly { handled: number; emitted: number }[]): number | null {
	let handled = 0;
	let emitted = 0;

	for (const sample of samples) {
		handled += sample.handled;
		emitted += sample.emitted;
	}

	return slaAvailabilityPpm(handled, emitted);
}

export type DemandRhythmId = "flat" | "office" | "evening" | "event";

const RAW_WEIGHTS: Record<DemandRhythmId, readonly [number, number, number, number]> = {
	flat: [1, 1, 1, 1],
	office: [0.2, 1.5, 1.4, 0.5],
	evening: [0.25, 0.65, 1, 2.1],
	event: [1, 1, 1, 1],
};

function toPermille(
	raw: readonly [number, number, number, number],
): readonly [number, number, number, number] {
	const mean = (raw[0] + raw[1] + raw[2] + raw[3]) / 4;

	return [
		Math.round((1000 * raw[0]) / mean),
		Math.round((1000 * raw[1]) / mean),
		Math.round((1000 * raw[2]) / mean),
		Math.round((1000 * raw[3]) / mean),
	];
}

export const DEMAND_RHYTHM_PERMILLE: Record<
	DemandRhythmId,
	readonly [number, number, number, number]
> = {
	flat: toPermille(RAW_WEIGHTS.flat),
	office: toPermille(RAW_WEIGHTS.office),
	evening: toPermille(RAW_WEIGHTS.evening),
	event: toPermille(RAW_WEIGHTS.event),
};

export function rhythmBandIndex(localHour: number): 0 | 1 | 2 | 3 {
	if (localHour < 0 || localHour > 23) {
		throw new Error(`localHour out of range: ${localHour}`);
	}

	return Math.min(3, Math.floor(localHour / 6)) as 0 | 1 | 2 | 3;
}

export function rhythmPermilleForLocalHour(rhythm: DemandRhythmId, localHour: number): number {
	return DEMAND_RHYTHM_PERMILLE[rhythm][rhythmBandIndex(localHour)];
}

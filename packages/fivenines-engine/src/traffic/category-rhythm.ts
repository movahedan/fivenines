import { TRAFFIC_POLICY, type TrafficHourBand } from "../catalog/traffic-policy";

export interface CategoryRhythm {
	permilleForLocalHour(localHourValue: number): number;
}

class TableRhythm implements CategoryRhythm {
	constructor(private readonly bands: readonly TrafficHourBand[]) {}

	permilleForLocalHour(localHourValue: number): number {
		const band = this.bands.find(
			(candidate) => candidate.startHour <= localHourValue && localHourValue <= candidate.endHour,
		);

		if (band === undefined) {
			throw new Error(`no traffic band for local hour ${String(localHourValue)}`);
		}

		return band.permille;
	}
}

export function rhythmFor(category: "shopping" | "saas" | "portfolio"): CategoryRhythm {
	switch (category) {
		case "shopping":
			return new TableRhythm(TRAFFIC_POLICY.rhythm.shopping);
		case "saas":
			return new TableRhythm(TRAFFIC_POLICY.rhythm.saas);
		case "portfolio":
			return new TableRhythm(TRAFFIC_POLICY.rhythm.portfolio);
	}
}

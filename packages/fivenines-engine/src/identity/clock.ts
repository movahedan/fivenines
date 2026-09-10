import { units } from "@packages/shared/units";

export function assertHourIndex(hourIndex: number): number {
	return units.asNonNegativeInteger(hourIndex, "hourIndex");
}

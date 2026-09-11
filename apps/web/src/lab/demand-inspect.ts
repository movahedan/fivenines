import { DemandEngine } from "@packages/fivenines-engine/demand-engine";

export function inspectAppointmentDemand(hourIndex: number): {
	readonly totalCount: number;
	readonly types: readonly string[];
} {
	const hour = DemandEngine.hourly("appointment-site", {
		projectId: "inspect-appointment",
		region: "utc+0",
	}).generate(hourIndex);

	return {
		totalCount: hour.totalCount,
		types: hour.batches.map((batch) => batch.demandTypeId),
	};
}

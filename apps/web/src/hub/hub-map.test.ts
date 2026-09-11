import { describe, expect, it } from "bun:test";

import { fleetHostProjection, lastCreditLabel, pathHourLabel, serviceStateLabel } from "./hub-map";

describe("hub-map - projection labels", () => {
	it("formats path outcomes including pending leftovers", () => {
		expect(pathHourLabel({ success: 10, fail: 2, pending: 0, estimatedLatency: 1 })).toBe(
			"10 ok · 2 miss",
		);
		expect(pathHourLabel({ success: 4, fail: 1, pending: 3, estimatedLatency: 1 })).toBe(
			"4 ok · 1 miss · 3 pending",
		);
	});

	it("names parked vs serving from project status", () => {
		expect(serviceStateLabel("offline")).toBe("parked");
		expect(serviceStateLabel("served")).toBe("serving");
		expect(serviceStateLabel("accepted")).toBe("accepted");
	});

	it("prints the latest settlement credit or an em dash", () => {
		expect(lastCreditLabel({ settlements: [] })).toBe("—");
		expect(
			lastCreditLabel({
				settlements: [
					{
						periodIndex: 1,
						hoursServedInPeriod: 88,
						paygCents: 0,
						recurringCents: 4190,
						creditCents: 4190,
						periodPpm: 501_994,
						periodRevenueCents: 4190,
					},
				],
			}),
		).toBe("$41.90");
	});

	it("projects Bronze disk stocks and GPU as unavailable", () => {
		const projection = fleetHostProjection({
			catalogId: "bronze",
			computeUnitsPerHour: 1000,
			networkBytesPerHour: 1_000_000,
			memoryMiB: 4096,
			diskOps: 7_200_000,
			metrics: {
				cpuLoad: 0,
				netLoad: 0,
				memOcc: 256,
				diskLoad: 0,
			},
		});

		expect(projection.diskLabel).toBe("65536 MiB");
		expect(projection.gpuUnavailableLabel).toBe("unavailable");
	});
});

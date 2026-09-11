import { describe, expect, it } from "bun:test";

import { inspectAppointmentDemand } from "./demand-inspect";

describe("demand inspect - appointment site", () => {
	it("emits typed roots without placing them", () => {
		const hour = inspectAppointmentDemand(10);

		expect(hour.totalCount).toBeGreaterThan(0);
		expect(hour.types).toContain("page-read");
	});
});

import { describe, expect, it } from "bun:test";

import { OPENING_COMMERCIAL_STUB } from "./catalog/commercial-policy";
import { Project, type ProjectInitial } from "./project";
import { FixedRandomSource, SequenceRandomSource } from "./traffic/random-source";

function shapedInitial(overrides: Partial<ProjectInitial> = {}): ProjectInitial {
	return {
		id: "project-1",
		estimatedRequestsPerHour: 1000,
		status: "offered",
		demand: "shaped",
		category: "shopping",
		region: "utc+0",
		campaignProne: false,
		commercial: OPENING_COMMERCIAL_STUB,
		...overrides,
	};
}

function servedInitial(overrides: Partial<ProjectInitial> = {}): ProjectInitial {
	return shapedInitial({
		status: "served",
		route: { kind: "server", serverId: "server-1" },
		...overrides,
	});
}

describe("Project - tick", () => {
	it("returns 0 without consuming RNG when the project is offered", () => {
		const project = new Project(shapedInitial());
		const random = new SequenceRandomSource([]);

		expect(project.tick(0, random)).toBe(0);
		expect(project.metrics.emittedRequests).toBe(0);
	});

	it("emits demand when the project is served", () => {
		const project = new Project(servedInitial());
		const emittedRequests = project.tick(0, new FixedRandomSource(0.5));

		expect(emittedRequests).toBeGreaterThan(0);
		expect(project.metrics.emittedRequests).toBe(emittedRequests);
	});

	it("emits demand when the project is parked offline", () => {
		const project = new Project(shapedInitial({ status: "offline" }));
		const emittedRequests = project.tick(0, new FixedRandomSource(0.5));

		expect(emittedRequests).toBeGreaterThan(0);
		expect(project.metrics.emittedRequests).toBe(emittedRequests);
	});
});

describe("Project - construction", () => {
	it("throws when region is unknown", () => {
		expect(
			() =>
				new Project(
					shapedInitial({
						region: "utc+3" as unknown as ProjectInitial["region"],
					}),
				),
		).toThrow("unknown region: utc+3");
	});

	it("throws when campaign durationHours is 0", () => {
		expect(
			() => new Project(shapedInitial({ campaign: { startHour: 0, durationHours: 0 } })),
		).toThrow();
	});

	it("throws when category is unknown", () => {
		expect(
			() =>
				new Project(
					shapedInitial({
						category: "shop" as unknown as ProjectInitial["category"],
					}),
				),
		).toThrow("unknown project category: shop");
	});

	it("throws when PAYG and recurring are both 0", () => {
		expect(
			() =>
				new Project(
					shapedInitial({
						commercial: {
							paygCentsPerThousandHandled: 0,
							recurringCentsPerPeriod: 0,
							targetPpm: OPENING_COMMERCIAL_STUB.targetPpm,
							creditPpm: OPENING_COMMERCIAL_STUB.creditPpm,
						},
					}),
				),
		).toThrow(
			"at least one of paygCentsPerThousandHandled or recurringCentsPerPeriod must be positive",
		);
	});

	it("throws when a served project has no route", () => {
		expect(() => new Project(shapedInitial({ status: "served" }))).toThrow(
			"served project requires a route: project-1",
		);
	});

	it("throws when a non-served project carries a route", () => {
		for (const status of ["offered", "declined", "offline"] as const) {
			expect(
				() =>
					new Project(shapedInitial({ status, route: { kind: "server", serverId: "server-1" } })),
			).toThrow("only a served project can have a route: project-1");
		}
	});

	it("keeps the route on a served project and leaves it undefined otherwise", () => {
		expect(new Project(servedInitial()).route).toEqual({ kind: "server", serverId: "server-1" });
		expect(new Project(shapedInitial({ status: "offline" })).route).toBeUndefined();
		expect(new Project(shapedInitial()).route).toBeUndefined();
	});
});

describe("Project - asServed", () => {
	it("copies existing commercial terms without inventing a catalog card", () => {
		const offered = new Project(
			shapedInitial({
				commercial: {
					paygCentsPerThousandHandled: 3,
					recurringCentsPerPeriod: 4_000,
					targetPpm: 950_000,
					creditPpm: 50_000,
				},
			}),
		);
		const served = offered.asServed("server-1");

		expect(served.status).toBe("served");
		expect(served.route).toEqual({ kind: "server", serverId: "server-1" });
		expect(served.commercial).toEqual({
			paygCentsPerThousandHandled: 3,
			recurringCentsPerPeriod: 4_000,
			targetPpm: 950_000,
			creditPpm: 50_000,
		});
	});
});

describe("Project - asOffline", () => {
	it("clears the route and keeps period buckets when a served project is parked", () => {
		const served = new Project(servedInitial());
		const parked = served.asOffline();

		expect(parked.status).toBe("offline");
		expect(parked.route).toBeUndefined();
		expect(parked.hoursServedInPeriod).toBe(served.hoursServedInPeriod);
		expect(parked.slaHours).toEqual(served.slaHours);
	});

	it("throws when the project is not served", () => {
		expect(() => new Project(shapedInitial()).asOffline()).toThrow(
			"project is not served: project-1",
		);
	});
});

describe("Project - asRoutedTo", () => {
	it("moves a served project to another box", () => {
		const moved = new Project(servedInitial()).asRoutedTo("server-2");

		expect(moved.status).toBe("served");
		expect(moved.route).toEqual({ kind: "server", serverId: "server-2" });
	});

	it("brings a parked project back to served", () => {
		const revived = new Project(shapedInitial({ status: "offline" })).asRoutedTo("server-2");

		expect(revived.status).toBe("served");
		expect(revived.route).toEqual({ kind: "server", serverId: "server-2" });
	});

	it("throws when the project is neither served nor offline", () => {
		expect(() => new Project(shapedInitial()).asRoutedTo("server-1")).toThrow(
			"project is not routable: project-1",
		);
	});
});

describe("Project - asDeclined", () => {
	it("copies existing commercial terms and period fields without inventing a catalog card", () => {
		const offered = new Project(
			shapedInitial({
				commercial: {
					paygCentsPerThousandHandled: 3,
					recurringCentsPerPeriod: 4_000,
					targetPpm: 950_000,
					creditPpm: 50_000,
				},
			}),
		);
		const declined = offered.asDeclined();

		expect(declined.status).toBe("declined");
		expect(declined.commercial).toEqual({
			paygCentsPerThousandHandled: 3,
			recurringCentsPerPeriod: 4_000,
			targetPpm: 950_000,
			creditPpm: 50_000,
		});
		expect(declined.slaHours).toEqual(offered.slaHours);
		expect(declined.settlements).toEqual(offered.settlements);
		expect(declined.hoursServedInPeriod).toBe(offered.hoursServedInPeriod);
	});

	it("throws when the project is not offered", () => {
		const served = new Project(servedInitial());

		expect(() => served.asDeclined()).toThrow("project is not offered: project-1");
	});
});

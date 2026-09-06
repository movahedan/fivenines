import { describe, expect, it } from "bun:test";

import { Project, type ProjectInitial } from "./project";
import { FixedRandomSource, SequenceRandomSource } from "./traffic/random-source";

function shapedInitial(overrides: Partial<ProjectInitial> = {}): ProjectInitial {
	return {
		id: "project-1",
		estimatedRequestsPerHour: 1000,
		status: "offered",
		demand: "shaped",
		category: "shopping",
		timezoneHours: 0,
		campaignProne: false,
		...overrides,
	};
}

describe("Project - tick", () => {
	it("returns 0 without consuming RNG when the project is offered", () => {
		const project = new Project(shapedInitial());
		const random = new SequenceRandomSource([]);

		expect(project.tick(0, random)).toBe(0);
	});

	it("emits demand when the project is served", () => {
		const project = new Project(shapedInitial({ status: "served" }));

		expect(project.tick(0, new FixedRandomSource(0.5))).toBeGreaterThan(0);
	});
});

describe("Project - construction", () => {
	it("throws when timezoneHours is outside the policy range", () => {
		expect(() => new Project(shapedInitial({ timezoneHours: 99 }))).toThrow();
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
});

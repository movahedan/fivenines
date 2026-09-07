import { describe, expect, it } from "bun:test";

import { SLA_WINDOW_HOURS } from "./catalog/sla-policy";
import { constantProject, oneBronzeInitial } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./game";
import type { Project } from "./project";

function allProjects(game: Game): Project[] {
	return game.customers.flatMap((customer) => [...customer.projects]);
}

function servedProjects(game: Game): Project[] {
	return allProjects(game).filter((project) => project.status === "served");
}

function emptyFleetInitial(projects: GameInitial["customers"][number]["projects"]): GameInitial {
	return {
		customers: [{ id: "customer-1", projects }],
		assets: [],
	};
}

describe("Game - SLA attribution", () => {
	it("conserves emitted as handled plus unroutable plus capacity drop per project", () => {
		const overloaded = new Game(oneBronzeInitial).tick();
		const ramBound = new Game({
			customers: oneBronzeInitial.customers,
			assets: [{ kind: "server", id: "server-1", catalogId: "thin-ram", region: "utc+0" }],
		}).tick();

		for (const game of [overloaded, ramBound]) {
			let attributedHandled = 0;

			for (const project of servedProjects(game)) {
				const { handledRequests, unroutableRequests, capacityDropRequests, emittedRequests } =
					project.metrics;

				expect(handledRequests + unroutableRequests + capacityDropRequests).toBe(emittedRequests);
				attributedHandled += handledRequests;
			}

			expect(attributedHandled).toBe(game.metrics.handledRequests);
		}
	});

	it("records zero handled and 0 ppm when a served project faces an empty fleet", () => {
		const game = new Game(emptyFleetInitial([constantProject("project-1", 700, "served")])).tick();
		const project = servedProjects(game)[0];

		expect(project?.metrics.availabilityPpm).toBe(0);
		expect(project?.slaHours).toEqual([{ handled: 0, emitted: 700 }]);
	});

	it("leaves the SLA ring unchanged when an offered project ticks", () => {
		const game = new Game(emptyFleetInitial([constantProject("project-1", 700, "offered")]));
		const project = allProjects(game)[0];

		game.tick();
		game.tick();

		expect(project?.slaHours).toEqual([]);
		expect(project?.metrics.availabilityPpm).toBeNull();
		expect(project?.metrics.windowAvailabilityPpm).toBeNull();
	});

	it("omits a zero-emit hour from the ring and reports null this-hour ppm", () => {
		const game = new Game(emptyFleetInitial([constantProject("project-1", 0, "served")])).tick();
		const project = servedProjects(game)[0];

		expect(project?.metrics.emittedRequests).toBe(0);
		expect(project?.metrics.availabilityPpm).toBeNull();
		expect(project?.slaHours).toEqual([]);
	});

	it("caps the ring at 168 busy hours and slides the window sum", () => {
		const game = new Game(emptyFleetInitial([constantProject("project-1", 10, "served")]));

		for (let hour = 0; hour < SLA_WINDOW_HOURS + 1; hour += 1) {
			game.tick();
		}

		const project = servedProjects(game)[0];

		expect(project?.slaHours).toHaveLength(SLA_WINDOW_HOURS);
		expect(project?.metrics.windowAvailabilityPpm).toBe(0);
		expect(project?.slaHours.every((sample) => sample.emitted === 10 && sample.handled === 0)).toBe(
			true,
		);
	});

	it("does not rewrite past ring slots when a sibling project is accepted", () => {
		const game = new Game(
			emptyFleetInitial([
				constantProject("project-1", 10, "served"),
				constantProject("project-2", 10, "offered"),
			]),
		).tick();
		const served = allProjects(game).find((project) => project.id === "project-1");
		const ringBefore = served?.slaHours;

		game.dispatch({ type: "acceptProject", payload: { projectId: "project-2" } });

		const servedAfter = allProjects(game).find((project) => project.id === "project-1");

		expect(servedAfter?.slaHours).toBe(ringBefore);
		expect(servedAfter?.slaHours).toEqual([{ handled: 0, emitted: 10 }]);
	});

	it("keeps Bronze 1400 physics and records a miss on at least one served project", () => {
		const game = new Game(oneBronzeInitial).tick();
		const ppms = servedProjects(game).map((project) => project.metrics.availabilityPpm);

		expect(game.metrics.handledRequests).toBe(1000);
		expect(game.metrics.droppedRequests).toBe(400);
		expect(game.metrics.errorPpm).toBe(Math.floor((400 * 1_000_000) / 1400));
		expect(ppms.every((ppm) => ppm !== null)).toBe(true);
		expect(ppms.some((ppm) => (ppm ?? 1_000_000) < 1_000_000)).toBe(true);
	});
});

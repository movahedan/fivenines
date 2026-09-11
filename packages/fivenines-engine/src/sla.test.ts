import { describe, expect, it } from "bun:test";

import { SLA_WINDOW_HOURS } from "./catalog/sla-policy";
import { constantProject, oneBronzeInitial } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./game";
import type { Project } from "./project";

function allProjects(game: Game): Project[] {
	return game.customers.flatMap((customer) => [...customer.projects]);
}

function projectOf(game: Game, projectId: string): Project | undefined {
	return allProjects(game).find((project) => project.id === projectId);
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

function oneBronzeWith(projects: GameInitial["customers"][number]["projects"]): GameInitial {
	return {
		customers: [{ id: "customer-1", projects }],
		assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
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

	it("records zero handled and 0 ppm when a parked project emits with nothing routed", () => {
		const game = new Game(emptyFleetInitial([constantProject("project-1", 700, "offline")])).tick();
		const project = projectOf(game, "project-1");

		expect(project?.metrics.availabilityPpm).toBe(0);
		expect(project?.metrics.unroutableRequests).toBe(700);
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
		const game = new Game(oneBronzeWith([constantProject("project-1", 0, "served", "server-1")]));

		game.tick();

		const project = servedProjects(game)[0];

		expect(project?.metrics.emittedRequests).toBe(0);
		expect(project?.metrics.availabilityPpm).toBeNull();
		expect(project?.slaHours).toEqual([]);
	});

	it("caps the ring at 168 emitting hours and slides the window sum", () => {
		const game = new Game(emptyFleetInitial([constantProject("project-1", 10, "offline")]));

		for (let hour = 0; hour < SLA_WINDOW_HOURS + 1; hour += 1) {
			game.tick();
		}

		const project = projectOf(game, "project-1");

		expect(project?.slaHours).toHaveLength(SLA_WINDOW_HOURS);
		expect(project?.metrics.windowAvailabilityPpm).toBe(0);
		expect(project?.slaHours.every((sample) => sample.emitted === 10 && sample.handled === 0)).toBe(
			true,
		);
	});

	it("does not rewrite past ring slots when a sibling project is accepted", () => {
		const game = new Game(
			oneBronzeWith([
				constantProject("project-1", 10, "served", "server-1"),
				constantProject("project-2", 10, "offered"),
			]),
		).tick();
		const ringBefore = projectOf(game, "project-1")?.slaHours;

		game.dispatch({
			type: "acceptProject",
			payload: { projectId: "project-2" },
		});

		const servedAfter = projectOf(game, "project-1");

		expect(servedAfter?.slaHours).toBe(ringBefore);
		expect(servedAfter?.slaHours).toEqual([{ handled: 10, emitted: 10 }]);
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

describe("Game - parked hours", () => {
	it("counts a parked hour as an unroutable SLA miss without a served hour or PAYG", () => {
		const game = new Game(oneBronzeWith([constantProject("project-1", 700, "served", "server-1")]));

		game.tick();

		const served = projectOf(game, "project-1");

		expect(served?.metrics.handledRequests).toBe(700);
		expect(served?.hoursServedInPeriod).toBe(1);
		expect(served?.metrics.windowAvailabilityPpm).toBe(1_000_000);

		const receivableBeforeCents = game.accountsReceivableCents;

		game.dispatch({ type: "unassignProject", payload: { projectId: "project-1" } });
		game.tick();

		const parked = projectOf(game, "project-1");

		expect(parked?.status).toBe("offline");
		expect(parked?.metrics.emittedRequests).toBe(700);
		expect(parked?.metrics.unroutableRequests).toBe(700);
		expect(parked?.metrics.handledRequests).toBe(0);
		expect(parked?.slaHours).toEqual([
			{ handled: 700, emitted: 700 },
			{ handled: 0, emitted: 700 },
		]);
		expect(parked?.metrics.windowAvailabilityPpm).toBe(500_000);
		expect(parked?.hoursServedInPeriod).toBe(1);
		expect(parked?.periodEmitted).toBe(1_400);
		expect(parked?.periodHandled).toBe(700);
		expect(game.accountsReceivableCents).toBe(receivableBeforeCents);
	});
});

import { describe, expect, it } from "bun:test";

import { OPENING_COMMERCIAL_STUB } from "./catalog/commercial-policy";
import { SKU_ECONOMY, STARTING_CASH_CENTS } from "./catalog/economy-policy";
import { constantProject, oneBronzeInitial, openingInitial, twoBronzeInitial } from "./fixtures";
import type { GameInitial } from "./game";
import { Game } from "./game";
import type { Project } from "./project";

function allProjects(game: Game): Project[] {
	return game.customers.flatMap((customer) => [...customer.projects]);
}

function emptyFleetInitial(projects: GameInitial["customers"][number]["projects"]): GameInitial {
	return {
		customers: [{ id: "customer-1", projects }],
		assets: [],
	};
}

describe("Game - PAYG", () => {
	it("credits handled times paygCentsPerHandled after opex and buckets the hour", () => {
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [
						{
							...constantProject("project-1", 100, "served"),
							paygCentsPerHandled: 7,
						},
					],
				},
			],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			cashCents: 10_000,
		}).tick();
		const project = allProjects(game)[0];
		const paygCents = (project?.metrics.handledRequests ?? 0) * 7;

		expect(project?.metrics.handledRequests).toBe(100);
		expect(project?.hoursServedInPeriod).toBe(1);
		expect(project?.periodPaygCents).toBe(paygCents);
		expect(project?.periodHandled).toBe(100);
		expect(project?.periodEmitted).toBe(100);
		expect(game.cashCents).toBe(10_000 - game.finance.opexCents + paygCents);
	});

	it("credits 0 PAYG on emit-0 and still increments hoursServedInPeriod", () => {
		const game = new Game(emptyFleetInitial([constantProject("project-1", 0, "served")])).tick();
		const project = allProjects(game)[0];

		expect(project?.metrics.emittedRequests).toBe(0);
		expect(project?.hoursServedInPeriod).toBe(1);
		expect(project?.periodPaygCents).toBe(0);
		expect(project?.periodHandled).toBe(0);
		expect(project?.periodEmitted).toBe(0);
		expect(game.cashCents).toBe(STARTING_CASH_CENTS);
	});

	it("credits 0 PAYG when the project is offered or declined", () => {
		const bronze = SKU_ECONOMY.bronze;
		const idleOpex = bronze.maintenanceCentsPerHour + bronze.idlePowerCentsPerHour;

		for (const status of ["offered", "declined"] as const) {
			const game = new Game({
				customers: [
					{
						id: "customer-1",
						projects: [constantProject("project-1", 700, status)],
					},
				],
				assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			}).tick();
			const project = allProjects(game)[0];

			expect(project?.status).toBe(status);
			expect(project?.hoursServedInPeriod).toBe(0);
			expect(project?.periodPaygCents).toBe(0);
			expect(game.cashCents).toBe(STARTING_CASH_CENTS - idleOpex);
		}
	});

	it("still credits PAYG while jailed", () => {
		const game = new Game({
			...oneBronzeInitial,
			jailed: true,
			cashCents: 0,
		}).tick();
		const paygCents = allProjects(game).reduce(
			(sum, project) => sum + project.metrics.handledRequests * project.paygCentsPerHandled,
			0,
		);

		expect(game.jailed).toBe(true);
		expect(paygCents).toBeGreaterThan(0);
		expect(game.cashCents).toBe(0 - game.finance.opexCents + paygCents);
	});

	it("puts the opening stub on every opening project", () => {
		const game = new Game(openingInitial);

		for (const project of allProjects(game)) {
			expect(project.paygCentsPerHandled).toBe(OPENING_COMMERCIAL_STUB.paygCentsPerHandled);
			expect(project.recurringCentsPerPeriod).toBe(OPENING_COMMERCIAL_STUB.recurringCentsPerPeriod);
			expect(project.targetPpm).toBe(OPENING_COMMERCIAL_STUB.targetPpm);
			expect(project.creditPpm).toBe(OPENING_COMMERCIAL_STUB.creditPpm);
		}
	});

	it("leaves Bronze 1400 physics unchanged after PAYG", () => {
		const overloaded = new Game(oneBronzeInitial).tick();
		const healthy = new Game(twoBronzeInitial).tick();

		expect(overloaded.metrics.handledRequests + overloaded.metrics.droppedRequests).toBe(1400);
		expect(healthy.metrics.handledRequests).toBe(1400);
		expect(healthy.metrics.droppedRequests).toBe(0);
	});
});

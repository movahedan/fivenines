import { describe, expect, it } from "bun:test";

import {
	commercialTermsForCategory,
	PAYG_ONLY_COMMERCIAL_STUB,
	paygCentsForHandled,
} from "./catalog/commercial-policy";
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
	it("credits floor of handled times paygCentsPerThousandHandled over 1000 after opex and buckets the hour", () => {
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [
						{
							...constantProject("project-1", 100, "served"),
							commercial: { ...PAYG_ONLY_COMMERCIAL_STUB, paygCentsPerThousandHandled: 7_000 },
						},
					],
				},
			],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			cashCents: 10_000,
		}).tick();
		const project = allProjects(game)[0];
		const paygCents = paygCentsForHandled(project?.metrics.handledRequests ?? 0, 7_000);

		expect(project?.metrics.handledRequests).toBe(100);
		expect(project?.hoursServedInPeriod).toBe(1);
		expect(project?.periodPaygCents).toBe(paygCents);
		expect(project?.periodHandled).toBe(100);
		expect(project?.periodEmitted).toBe(100);
		expect(game.accountsReceivableCents).toBe(paygCents);
		expect(game.cashCents).toBe(10_000 - game.finance.opexCents);
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
			(sum, project) =>
				sum +
				paygCentsForHandled(
					project.metrics.handledRequests,
					project.commercial.paygCentsPerThousandHandled,
				),
			0,
		);

		expect(game.jailed).toBe(true);
		expect(paygCents).toBeGreaterThan(0);
		expect(game.accountsReceivableCents).toBe(paygCents);
		expect(game.cashCents).toBe(0 - game.finance.opexCents);
	});

	it("puts category PAYG and recurring on every opening project", () => {
		const game = new Game(openingInitial);

		for (const project of allProjects(game)) {
			const card = commercialTermsForCategory(project.category);

			expect(project.commercial.paygCentsPerThousandHandled).toBe(card.paygCentsPerThousandHandled);
			expect(project.commercial.recurringCentsPerPeriod).toBe(card.recurringCentsPerPeriod);
		}
	});

	it("settles PAYG receivable into cash after 24 hours", () => {
		const game = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [constantProject("project-1", 100, "served")],
				},
			],
			assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			cashCents: 20_000,
		});
		let accruedPayg = 0;

		for (let hour = 0; hour < 23; hour++) {
			game.tick();
			accruedPayg += paygCentsForHandled(
				game.customers[0]?.projects[0]?.metrics.handledRequests ?? 0,
				PAYG_ONLY_COMMERCIAL_STUB.paygCentsPerThousandHandled,
			);
			expect(game.hourIndex).toBe(hour + 1);
			expect(game.accountsReceivableCents).toBe(accruedPayg);
		}

		game.tick();
		accruedPayg += paygCentsForHandled(
			game.customers[0]?.projects[0]?.metrics.handledRequests ?? 0,
			PAYG_ONLY_COMMERCIAL_STUB.paygCentsPerThousandHandled,
		);

		expect(game.hourIndex).toBe(24);
		expect(game.accountsReceivableCents).toBe(0);
		expect(game.cashCents).toBe(20_000 - game.finance.opexCents * 24 + accruedPayg);
	});

	it("leaves Bronze 1400 physics unchanged after PAYG", () => {
		const overloaded = new Game(oneBronzeInitial).tick();
		const healthy = new Game(twoBronzeInitial).tick();

		expect(overloaded.metrics.handledRequests + overloaded.metrics.droppedRequests).toBe(1400);
		expect(healthy.metrics.handledRequests).toBe(1400);
		expect(healthy.metrics.droppedRequests).toBe(0);
	});
});

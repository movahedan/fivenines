import { describe, expect, it } from "bun:test";

import type { GameInitial } from "./game";
import { Game } from "./game";
import type { ProjectInitial } from "./project";
import { FixedRandomSource } from "./traffic/random-source";

function shoppingServedProject(region: ProjectInitial["region"]): ProjectInitial {
	return {
		id: "shop",
		estimatedRequestsPerHour: 1000,
		status: "served",
		demand: "shaped",
		category: "shopping",
		region,
		campaignProne: false,
	};
}

function unroutableShoppingGame(region: ProjectInitial["region"]): Game {
	const initial: GameInitial = {
		customers: [
			{
				id: "customer-1",
				projects: [shoppingServedProject(region)],
			},
		],
		assets: [],
	};

	return new Game(initial, { random: new FixedRandomSource(0.5) });
}

describe("Game - traffic", () => {
	it("drops more unroutable shopping demand at local evening than local night after seven ticks", () => {
		const evening = unroutableShoppingGame("utc-8");
		const night = unroutableShoppingGame("utc+0");

		for (let tickCount = 0; tickCount < 7; tickCount += 1) {
			evening.tick();
			night.tick();
		}

		expect(evening.metrics.droppedRequests).toBeGreaterThan(night.metrics.droppedRequests);
	});
});

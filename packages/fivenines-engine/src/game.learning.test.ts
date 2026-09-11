import { describe, expect, it } from "bun:test";

import { STARTING_CASH_CENTS } from "./catalog/economy-policy";
import { Game } from "./game";

describe("Game - learning commands", () => {
	it("debits tuition on enrollLearning and records Monitoring completion after 168 ticks", () => {
		const game = new Game({ customers: [], assets: [] });
		const cashBefore = game.cashCents;

		game.dispatch({
			type: "enrollLearning",
			payload: { subject: { kind: "research", technologyId: "monitoring" } },
		});

		expect(game.cashCents).toBe(cashBefore - 4_000);
		expect(game.learning.slotsUsed).toBe(1);

		for (let hour = 0; hour < 168; hour += 1) {
			game.tick();
		}

		expect(game.learning.completedTechnologyIds).toContain("monitoring");
		expect(game.learning.slotsUsed).toBe(0);
		expect(game.cashCents).toBe(cashBefore - 4_000);
	});

	it("throws enrollLearning while jailed and leaves cash unchanged", () => {
		const game = new Game({ customers: [], assets: [], cashCents: -20_000, jailed: true });

		expect(() =>
			game.dispatch({
				type: "enrollLearning",
				payload: { subject: { kind: "research", technologyId: "monitoring" } },
			}),
		).toThrow("cannot enrollLearning while jailed");
		expect(game.cashCents).toBe(-20_000);
		expect(STARTING_CASH_CENTS).toBeGreaterThan(0);
		expect(
			new Game({ customers: [], assets: [] }).learningCatalog.find((row) => row.id === "monitoring")
				?.status,
		).toBe("available");
	});
});

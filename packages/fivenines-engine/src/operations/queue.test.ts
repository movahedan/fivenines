import { describe, expect, it } from "bun:test";

import { firstProjectSetupTaskIds } from "../catalog/operations-policy";
import { openingInitial } from "../fixtures";
import { Game } from "../game";
import { OperationalQueue, skillAdjustedDurationMilliHours } from "./queue";

describe("OperationalQueue - slots and progress", () => {
	it("keeps cancelled progress when the same setup task is enqueued again", () => {
		const queue = new OperationalQueue();
		const id = queue.enqueue("maya-appointments", "install-application-runtime", {});

		queue.tick();
		queue.cancel(id);
		queue.enqueue("maya-appointments", "install-application-runtime", {});

		const active = queue.snapshot().tasks.find((task) => task.status === "active");

		expect(active?.progressMilliHours).toBe(1_000);
		expect(queue.snapshot().slotsUsed).toBe(1);
	});

	it("shortens duration using stored Deployment Automation levels", () => {
		expect(skillAdjustedDurationMilliHours("install-application-runtime", {})).toBe(2_000);
		expect(
			skillAdjustedDurationMilliHours("install-application-runtime", {
				"deployment-automation": 1,
			}),
		).toBe(1_840);
	});

	it("blocks shared configuration until both installs are complete", () => {
		const queue = new OperationalQueue();

		expect(() => queue.enqueue("maya-appointments", "configure-shared-connection", {})).toThrow(
			"setup prerequisite missing: install-application-runtime",
		);
	});
});

describe("Game - operational queue", () => {
	it("marks the acquaintance project ready after three setup tasks and never starts it", () => {
		const game = new Game(openingInitial);

		game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });

		for (const taskId of firstProjectSetupTaskIds()) {
			game.dispatch({
				type: "enqueueOperationalTask",
				payload: { projectId: "maya-appointments", taskId },
			});

			const durationHours = Math.ceil(
				(game.operations.tasks.find((task) => task.status === "active")?.durationMilliHours ?? 0) /
					1_000,
			);

			for (let hour = 0; hour < durationHours; hour += 1) {
				game.tick();
			}
		}

		const project = game.customers[0]?.projects[0];

		expect(project?.ready).toBe(true);
		expect(project?.status).toBe("accepted");
		expect(game.operations.slotsUsed).toBe(0);
	});

	it("does not enqueue setup work while jailed", () => {
		const game = new Game({ ...openingInitial, jailed: true });

		expect(() =>
			game.dispatch({
				type: "enqueueOperationalTask",
				payload: { projectId: "maya-appointments", taskId: "install-application-runtime" },
			}),
		).toThrow("cannot enqueueOperationalTask while jailed");
	});
});

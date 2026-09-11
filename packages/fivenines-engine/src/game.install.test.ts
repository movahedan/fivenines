import { describe, expect, it } from "bun:test";

import { firstProjectSetupHours } from "./catalog/operations-policy";
import { DEFAULT_REGION } from "./catalog/regions";
import { openingInitial } from "./fixtures";
import { Game } from "./game";

function acceptedMaya(): Game {
	const game = new Game(openingInitial);

	game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });
	game.dispatch({
		type: "buyServer",
		payload: { serverType: "bronze", region: DEFAULT_REGION },
	});
	game.dispatch({
		type: "placeSetup",
		payload: { projectId: "maya-appointments", serverId: "server-1" },
	});

	return game;
}

function finishTask(game: Game): void {
	const durationHours = Math.ceil(
		(game.operations.tasks.find((task) => task.status === "active")?.durationMilliHours ?? 0) /
			1_000,
	);

	for (let hour = 0; hour < durationHours; hour += 1) {
		game.tick();
	}
}

describe("Game - installation and power", () => {
	it("uses a five-hour first-project preset without serving", () => {
		expect(firstProjectSetupHours()).toBe(5);

		const game = acceptedMaya();
		const startHour = game.hourIndex;

		game.dispatch({
			type: "installService",
			payload: { projectId: "maya-appointments", serviceId: "application-runtime" },
		});
		finishTask(game);
		game.dispatch({
			type: "installService",
			payload: { projectId: "maya-appointments", serviceId: "relational-database" },
		});
		finishTask(game);
		game.dispatch({ type: "configureConnection", payload: { projectId: "maya-appointments" } });
		finishTask(game);

		const project = game.customers[0]?.projects[0];

		expect(game.hourIndex - startHour).toBe(5);
		expect(project?.installedServiceIds).toEqual(["application-runtime", "relational-database"]);
		expect(project?.connectionConfigured).toBe(true);
		expect(project?.ready).toBe(true);
		expect(project?.status).toBe("accepted");
		expect(project?.route).toBeUndefined();
	});

	it("powers on immediately and drops volatile ops progress on power-off", () => {
		const game = acceptedMaya();

		game.dispatch({
			type: "installService",
			payload: { projectId: "maya-appointments", serviceId: "application-runtime" },
		});
		game.tick();

		expect(game.assets[0]?.poweredOn).toBe(true);
		expect(game.hourIndex).toBe(1);

		const hourBeforePower = game.hourIndex;

		game.dispatch({ type: "powerOff", payload: { serverId: "server-1" } });

		expect(game.hourIndex).toBe(hourBeforePower);
		expect(game.assets[0]?.poweredOn).toBe(false);
		expect(game.operations.tasks.find((task) => task.status === "active")?.progressMilliHours).toBe(
			0,
		);

		game.dispatch({ type: "powerOn", payload: { serverId: "server-1" } });

		expect(game.hourIndex).toBe(hourBeforePower);
		expect(game.assets[0]?.poweredOn).toBe(true);
	});

	it("keeps park blocked during setup after placement", () => {
		const game = acceptedMaya();

		expect(() =>
			game.dispatch({ type: "unassignProject", payload: { projectId: "maya-appointments" } }),
		).toThrow("cannot park during setup: maya-appointments");
	});

	it("requires placement before install", () => {
		const game = new Game(openingInitial);

		game.dispatch({ type: "acceptProject", payload: { projectId: "maya-appointments" } });

		expect(() =>
			game.dispatch({
				type: "installService",
				payload: { projectId: "maya-appointments", serviceId: "application-runtime" },
			}),
		).toThrow("setup placement missing: maya-appointments");
	});

	it("rejects an unknown installable service", () => {
		const game = acceptedMaya();

		expect(() =>
			game.dispatch({
				type: "installService",
				payload: { projectId: "maya-appointments", serviceId: "object-storage" },
			}),
		).toThrow("unknown installable service: object-storage");
	});
});

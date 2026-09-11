import { describe, expect, it } from "bun:test";

import { constantProject, twoBronzeInitial } from "./fixtures";
import { Game } from "./game";

describe("Game - duplication and pending transfer", () => {
	it("duplicates only the chosen project and keeps the source serving", () => {
		const game = new Game(twoBronzeInitial);

		game.dispatch({
			type: "duplicateProject",
			payload: { projectId: "project-1", destinationServerId: "server-2" },
		});

		const ids = game.customers[0]?.projects.map((project) => project.id) ?? [];
		const copy = game.customers[0]?.projects.find((project) => project.id === "project-1-copy");
		const source = game.customers[0]?.projects.find((project) => project.id === "project-1");

		expect(ids).toEqual(["project-1", "project-2", "project-1-copy"]);
		expect(source?.status).toBe("served");
		expect(copy?.status).toBe("accepted");
		expect(copy?.ready).toBe(false);
		expect(copy?.pendingTransfer?.status).toBe("pending");
		expect(copy?.pendingTransfer?.remainingNetworkMiB).toBeGreaterThan(0);
		expect(copy?.pendingTransfer?.remainingDiskOps).toBeGreaterThan(0);
		expect(copy?.setupServerId).toBe("server-2");
		expect(() => copy?.withReady()).toThrow("pending transfer blocks ready: project-1-copy");
	});

	it("keeps the source serving and delays handover until allocated transfer work finishes", () => {
		const game = new Game({
			...twoBronzeInitial,
			assets: [
				...(twoBronzeInitial.assets ?? []),
				{ kind: "server", id: "server-3", catalogId: "bronze", region: "utc+0" },
			],
		});

		game.dispatch({
			type: "duplicateProject",
			payload: { projectId: "project-1", destinationServerId: "server-3" },
		});

		const afterOne = game.tick();
		const copyAfterOne = afterOne.customers[0]?.projects.find(
			(project) => project.id === "project-1-copy",
		);
		const sourceAfterOne = afterOne.customers[0]?.projects.find(
			(project) => project.id === "project-1",
		);

		expect(sourceAfterOne?.status).toBe("served");
		expect(copyAfterOne?.ready).toBe(false);
		expect(copyAfterOne?.pendingTransfer?.remainingNetworkMiB).toBeGreaterThan(0);

		let copy = copyAfterOne;
		for (let hour = 0; hour < 8 && copy?.pendingTransfer !== undefined; hour += 1) {
			game.tick();
			copy = game.customers[0]?.projects.find((project) => project.id === "project-1-copy");
		}

		expect(copy?.pendingTransfer).toBeUndefined();
		expect(copy?.ready).toBe(true);
		expect(game.customers[0]?.projects.find((project) => project.id === "project-1")?.status).toBe(
			"served",
		);

		game.dispatch({
			type: "startProject",
			payload: { projectId: "project-1-copy", serverId: "server-3" },
		});

		expect(
			game.customers[0]?.projects.find((project) => project.id === "project-1-copy")?.status,
		).toBe("served");
	});

	it("takes longer when the destination is already serving competing traffic", () => {
		const idle = new Game({
			...twoBronzeInitial,
			assets: [
				...(twoBronzeInitial.assets ?? []),
				{ kind: "server", id: "server-3", catalogId: "bronze", region: "utc+0" },
			],
		});
		const busy = new Game({
			customers: [
				{
					id: "customer-1",
					projects: [
						constantProject("project-1", 700, "served", "server-1"),
						{
							...constantProject("project-2", 1400, "served", "server-2"),
							category: "shopping",
						},
					],
				},
			],
			assets: [
				{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" },
				{ kind: "server", id: "server-2", catalogId: "bronze", region: "utc+0" },
			],
		});

		idle.dispatch({
			type: "duplicateProject",
			payload: { projectId: "project-1", destinationServerId: "server-3" },
		});
		busy.dispatch({
			type: "duplicateProject",
			payload: { projectId: "project-1", destinationServerId: "server-2" },
		});

		idle.tick();
		busy.tick();

		const idleLeft =
			idle.customers[0]?.projects.find((project) => project.id === "project-1-copy")
				?.pendingTransfer?.remainingNetworkMiB ?? 0;
		const busyLeft =
			busy.customers[0]?.projects.find((project) => project.id === "project-1-copy")
				?.pendingTransfer?.remainingNetworkMiB ?? 0;

		expect(busyLeft).toBeGreaterThan(idleLeft);
	});

	it("blocks start while the destination transfer is pending", () => {
		const game = new Game(twoBronzeInitial);

		game.dispatch({
			type: "duplicateProject",
			payload: { projectId: "project-1", destinationServerId: "server-2" },
		});

		expect(() =>
			game.dispatch({
				type: "startProject",
				payload: { projectId: "project-1-copy", serverId: "server-2" },
			}),
		).toThrow("project is not ready: project-1-copy");
	});

	it("rejects a thin-ram destination for a Bronze source", () => {
		const game = new Game({
			...twoBronzeInitial,
			assets: [
				...(twoBronzeInitial.assets ?? []),
				{ kind: "server", id: "server-3", catalogId: "thin-ram", region: "utc+0" },
			],
		});

		expect(() =>
			game.dispatch({
				type: "duplicateProject",
				payload: { projectId: "project-1", destinationServerId: "server-3" },
			}),
		).toThrow("destination is incompatible: server-3");
	});
});

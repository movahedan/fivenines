import { describe, expect, it } from "bun:test";

import { twoBronzeInitial } from "./fixtures";
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
		expect(copy?.setupServerId).toBe("server-2");
		expect(() => copy?.withReady()).toThrow("pending transfer blocks ready: project-1-copy");
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

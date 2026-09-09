import { describe, expect, it } from "bun:test";

import { SKU_ECONOMY } from "./catalog/economy-policy";
import {
	MONITORING_DISCOVERY_HOURS,
	MONITORING_OPEX_CENTS_PER_HOUR,
	OUTAGE_DEGRADED_HOURS,
	OUTAGE_DISCOVERY_DELAY_HOURS,
	OUTAGE_ONSET_PPM,
} from "./catalog/incident-policy";
import { constantProject } from "./fixtures";
import type { EngineEvent, GameInitial } from "./game";
import { Game } from "./game";
import { SequenceRandomSource } from "./traffic/random-source";

function bronzeServed(): GameInitial {
	return {
		customers: [
			{
				id: "customer-1",
				projects: [constantProject("project-1", 700, "served", "server-1")],
			},
		],
		assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
	};
}

function idleBronze(): GameInitial {
	return {
		customers: [],
		assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
	};
}

function outageEvents(events: readonly EngineEvent[]): readonly EngineEvent[] {
	return events.filter(
		(event) => event.type === "outageDiscovered" || event.type === "outageEscalated",
	);
}

describe("Game - serverOutage", () => {
	it("halves remaining compute headroom and handles less than an ok control on 700 RPS", () => {
		const control = new Game(bronzeServed());
		const outage = new Game(bronzeServed());

		expect(control.servers[0]?.remainingHeadroom).toBe(1000);

		outage.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });

		expect(outage.servers[0]?.health).toBe("degraded");
		expect(outage.servers[0]?.remainingHeadroom).toBe(500);
		expect(outage.hourIndex).toBe(0);

		control.tick();
		outage.tick();

		expect(outage.servers[0]?.health).toBe("degraded");
		expect(outage.metrics.handledRequests).toBe(500);
		expect(outage.metrics.droppedRequests).toBe(200);
		expect(control.metrics.handledRequests).toBe(700);
		expect(control.metrics.droppedRequests).toBe(0);
		expect(outage.metrics.handledRequests).toBeLessThan(control.metrics.handledRequests);
	});

	it("becomes unavailable on the third degraded hour with zero headroom and a full SLA miss", () => {
		const game = new Game(bronzeServed());

		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });
		game.tick();

		expect(game.servers[0]?.health).toBe("degraded");

		game.tick();

		expect(game.servers[0]?.health).toBe("degraded");

		game.tick();

		expect(game.servers[0]?.health).toBe("unavailable");
		expect(game.servers[0]?.remainingHeadroom).toBe(0);
		expect(game.metrics.handledRequests).toBe(0);
		expect(game.metrics.droppedRequests).toBe(700);
		expect(game.customers[0]?.projects[0]?.metrics.availabilityPpm).toBe(0);
	});

	it("restores full compute headroom when repairServer runs", () => {
		const game = new Game(bronzeServed());

		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });

		expect(game.servers[0]?.remainingHeadroom).toBe(500);

		game.dispatch({ type: "repairServer", payload: { serverId: "server-1" } });

		expect(game.servers[0]?.health).toBe("ok");
		expect(game.servers[0]?.outageHours).toBe(0);
		expect(game.servers[0]?.remainingHeadroom).toBe(1000);
		expect(game.hourIndex).toBe(0);
	});

	it("does not emit serverSaturated for an undiscovered outage", () => {
		const game = new Game(bronzeServed());

		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });
		game.tick();

		expect(game.servers[0]?.outageDiscovered).toBe(false);
		expect(game.events.some((event) => event.type === "serverSaturated")).toBe(false);
	});

	it("hides outageDiscovered for three hours without monitoring and emits it on hour four", () => {
		const game = new Game(bronzeServed());

		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });

		for (let hour = 0; hour < OUTAGE_DISCOVERY_DELAY_HOURS - 1; hour += 1) {
			game.tick();

			expect(
				outageEvents(game.events).filter((event) => event.type === "outageDiscovered"),
			).toEqual([]);
			expect(game.servers[0]?.outageDiscovered).toBe(false);
		}

		game.tick();

		expect(game.events).toContainEqual({
			type: "outageDiscovered",
			hourIndex: 3,
			serverId: "server-1",
			health: "unavailable",
		});
	});

	it("emits outageDiscovered on the onset hour when monitoring is installed first", () => {
		const game = new Game(bronzeServed());

		game.dispatch({ type: "installMonitoring", payload: { serverId: "server-1" } });
		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });
		game.tick();

		expect(game.events).toContainEqual({
			type: "outageDiscovered",
			hourIndex: 0,
			serverId: "server-1",
			health: "degraded",
		});
		expect(MONITORING_DISCOVERY_HOURS).toBe(0);
	});

	it("never puts a hidden outage line into game.events", () => {
		const game = new Game(bronzeServed());

		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });

		expect(outageEvents(game.events)).toEqual([]);

		game.tick();
		game.tick();
		game.tick();

		expect(outageEvents(game.events)).toEqual([]);
		expect(game.servers[0]?.health).toBe("unavailable");
		expect(game.servers[0]?.outageDiscovered).toBe(false);
	});

	it("emits outageEscalated only after the outage is discovered", () => {
		const hidden = new Game(bronzeServed());
		const watched = new Game(bronzeServed());

		hidden.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });
		watched.dispatch({ type: "installMonitoring", payload: { serverId: "server-1" } });
		watched.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });

		for (let hour = 0; hour < OUTAGE_DEGRADED_HOURS + 1; hour += 1) {
			hidden.tick();
			watched.tick();
		}

		expect(hidden.servers[0]?.health).toBe("unavailable");
		expect(outageEvents(hidden.events).some((event) => event.type === "outageEscalated")).toBe(
			false,
		);
		expect(watched.events).toContainEqual({
			type: "outageEscalated",
			hourIndex: 2,
			serverId: "server-1",
		});
	});

	it("does not consume random when rollIncidents is false after startOutage", () => {
		const game = new Game(bronzeServed(), { random: new SequenceRandomSource([]) });

		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });
		game.tick();

		expect(game.servers[0]?.health).toBe("degraded");
		expect(game.hourIndex).toBe(1);
	});

	it("does not roll onset when rollIncidents is omitted", () => {
		const game = new Game(bronzeServed(), { random: new SequenceRandomSource([]) });

		game.tick();

		expect(game.servers[0]?.health).toBe("ok");
		expect(game.hourIndex).toBe(1);
	});

	it("starts an outage when rollIncidents is true and the ppm roll hits", () => {
		const onsetUnit = (OUTAGE_ONSET_PPM - 1) / 1_000_000;
		const game = new Game(bronzeServed(), {
			random: new SequenceRandomSource([onsetUnit]),
			rollIncidents: true,
		});

		game.tick();

		expect(game.servers[0]?.health).toBe("degraded");
		expect(game.servers[0]?.outageHours).toBe(1);
	});

	it("charges monitoring opex on an idle tick", () => {
		const bronze = SKU_ECONOMY.bronze;
		const game = new Game(idleBronze());

		game.dispatch({ type: "installMonitoring", payload: { serverId: "server-1" } });
		game.tick();

		expect(game.finance.monitoringCents).toBe(MONITORING_OPEX_CENTS_PER_HOUR);
		expect(game.finance.opexCents).toBe(
			bronze.maintenanceCentsPerHour +
				bronze.idlePowerCentsPerHour +
				MONITORING_OPEX_CENTS_PER_HOUR,
		);
	});

	it("does not emit outage events when startOutage is dispatched", () => {
		const game = new Game(bronzeServed());

		game.tick();
		const afterTick = game.events;

		game.dispatch({ type: "startOutage", payload: { serverId: "server-1" } });

		expect(game.events).toBe(afterTick);
		expect(outageEvents(game.events)).toEqual([]);
	});
});

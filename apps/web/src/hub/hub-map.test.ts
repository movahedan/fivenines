import { describe, expect, it } from "bun:test";

import {
	FixedRandomSource,
	Game,
	PAYG_ONLY_COMMERCIAL_STUB,
	SequenceRandomSource,
	twoBronzeInitial,
} from "@packages/fivenines-engine";

import {
	addedAssetId,
	axisPercent,
	commandLogTone,
	engineEventMessage,
	SKU_DOT_CLASS,
	skuCostLabel,
	skuCpuLabel,
	skuFleetOpexLabel,
	skuLeaseLabel,
	skuNetLabel,
	slaPercent,
	slaShareLabel,
	slaStatusLabel,
	sparklineTargetFromPpm,
} from "./hub-map";

describe("hub-map - sla and sku labels", () => {
	it("maps window ppm onto a 0-100 bar and status words", () => {
		expect(slaPercent(null)).toBe(0);
		expect(slaPercent(990_000)).toBe(99);
		expect(slaStatusLabel(null, 990_000)).toBe("warming");
		expect(slaStatusLabel(995_000, 990_000)).toBe("meeting");
		expect(slaStatusLabel(960_000, 990_000)).toBe("at risk");
		expect(slaStatusLabel(800_000, 990_000)).toBe("breach");
	});

	it("formats idle SKU money and compute labels", () => {
		expect(skuCostLabel("bronze")).toBe("$180.00");
		expect(skuCpuLabel("bronze")).toBe("1000 cores");
		expect(skuNetLabel("bronze")).toBe("1000000 B/h");
		expect(SKU_DOT_CLASS.bronze).toContain("shadow-glow-warning");
	});

	it("formats lease rent from catalog hourly cents", () => {
		expect(skuLeaseLabel("bronze")).toBe("$1.47/h rent");
	});

	it("adds rent into the fleet opex label for a leased box", () => {
		expect(skuFleetOpexLabel("bronze", { kind: "leased", hourlyCents: 147 })).toBe(
			"$2.62/h idle+rent",
		);
		expect(skuFleetOpexLabel("bronze", { kind: "owned", purchaseCents: 18_000 })).toBe(
			"$1.15/h idle",
		);
	});

	it("returns the id that was not in the previous set", () => {
		expect(addedAssetId(new Set(["server-1"]), [{ id: "server-1" }, { id: "server-2" }])).toBe(
			"server-2",
		);
	});

	it("maps load versus cap onto an integer percent", () => {
		expect(axisPercent(0, 1000)).toBe(0);
		expect(axisPercent(400, 1000)).toBe(40);
		expect(axisPercent(256, 4096)).toBe(6);
	});

	it("formats availability ppm as a percent share", () => {
		expect(slaShareLabel(null)).toBe("—");
		expect(slaShareLabel(1_000_000)).toBe("100.00%");
		expect(slaShareLabel(822_700)).toBe("82.27%");
		expect(sparklineTargetFromPpm(990_000)).toBe(0.99);
	});

	it("formats a PAYG settle event as a log line", () => {
		expect(engineEventMessage({ type: "paygSettled", hourIndex: 24, cents: 100 })).toBe(
			"PAYG settled $1.00",
		);
	});

	it("tones start and cancel setup commands", () => {
		expect(commandLogTone("startProject")).toBe("success");
		expect(commandLogTone("cancelSetup")).toBe("warn");
		expect(commandLogTone("acceptProject")).toBe("info");
		expect(commandLogTone("enqueueOperationalTask")).toBe("success");
		expect(commandLogTone("cancelOperationalTask")).toBe("warn");
		expect(commandLogTone("installService")).toBe("success");
		expect(commandLogTone("powerOff")).toBe("warn");
		expect(commandLogTone("duplicateProject")).toBe("info");
	});

	it("still ticks served teaching fixtures so hub coverage includes live demand", () => {
		const random = new SequenceRandomSource([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
		const game = new Game(twoBronzeInitial, { random: new FixedRandomSource(0.5) }).tick();
		const shaped = new Game(
			{
				customers: [
					{
						id: "customer-1",
						projects: [
							{
								id: "shaped-1",
								estimatedRequestsPerHour: 100,
								status: "served",
								demand: "shaped",
								category: "saas",
								region: "utc+0",
								campaignProne: false,
								commercial: PAYG_ONLY_COMMERCIAL_STUB,
								route: { kind: "server", serverId: "server-1" },
							},
						],
					},
				],
				assets: [{ kind: "server", id: "server-1", catalogId: "bronze", region: "utc+0" }],
			},
			{ random },
		).tick();

		expect(game.metrics.handledRequests).toBeGreaterThan(0);
		expect(shaped.metrics.handledRequests).toBeGreaterThan(0);
	});

	it("tones learning commands and leaves completed base research on a new game", () => {
		expect(commandLogTone("enrollLearning")).toBe("success");
		expect(commandLogTone("pauseLearning")).toBe("warn");
		expect(commandLogTone("cancelLearning")).toBe("warn");

		const game = new Game({ customers: [], assets: [] });
		game.dispatch({
			type: "enrollLearning",
			payload: { subject: { kind: "research", technologyId: "monitoring" } },
		});

		game.dispatch({
			type: "pauseLearning",
			payload: { enrollmentId: game.learning.enrollments[0]?.id ?? "" },
		});
		game.dispatch({
			type: "resumeLearning",
			payload: { enrollmentId: game.learning.enrollments[0]?.id ?? "" },
		});

		expect(game.learning.enrollments[0]?.status).toBe("active");
	});
});

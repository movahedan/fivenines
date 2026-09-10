import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadBaselineDocument } from "../baseline/load";
import type { BaselineDocument } from "../baseline/types";
import { CatalogCompileError, compileAuthoredCatalog, compileCatalog } from "./compile";
import { HARDWARE_WORK_FIELDS, networkMiBFromMbps } from "./hardware-catalog";

describe("catalog compile - authored baseline", () => {
	it("translates design-0.3 hardware into integer work units", () => {
		const catalog = compileAuthoredCatalog();
		const small = catalog.hardware.find((row) => row.id === "general-small");
		const gpu = catalog.hardware.find((row) => row.id === "gpu-large");

		expect(catalog.time).toEqual({
			version: "design-0.3",
			hoursPerTick: 1,
			cpuWorkPerCoreHour: 1000,
		});
		expect(small).toMatchObject({
			id: "general-small",
			cpuWork: 2000,
			gpuWork: 0,
			diskOps: 2000,
			networkMiB: 44,
			residentMemoryMiB: 2048,
			queuedMemoryMiB: 0,
			diskCapacityMiB: 65_536,
			gpuCount: 0,
		});
		expect(gpu).toMatchObject({
			id: "gpu-large",
			cpuWork: 20_800,
			gpuWork: 24_000,
			gpuCount: 2,
		});
		expect(HARDWARE_WORK_FIELDS).toContain("cpuWork");
	});

	it("stores technology DAG edges as ids", () => {
		const catalog = compileAuthoredCatalog();
		const workers = catalog.technologies.find((row) => row.id === "background-workers");
		const runtime = catalog.technologies.find((row) => row.id === "application-runtime");

		expect(runtime?.prerequisiteIds).toEqual([]);
		expect(workers?.prerequisiteIds).toEqual(["application-runtime"]);
	});

	it("keeps design money on an audit record instead of live SKU cents", () => {
		const small = compileAuthoredCatalog().hardware.find((row) => row.id === "general-small");

		expect(small?.design.purchase).toBe(240);
		expect(small?.design.dailyRent).toBe(2.5);
	});

	it("matches the explicit Mbps to MiB rounding rule", () => {
		expect(networkMiBFromMbps(100)).toBe(44);
	});
});

describe("catalog compile - rejection", () => {
	it("rejects duplicate hardware ids without producing a catalog", () => {
		const document = mutate((next) => {
			const first = next.hardware[0];

			if (first === undefined) {
				throw new Error("expected hardware");
			}

			next.hardware.push({ ...first });
		});

		expect(() => compileCatalog(document)).toThrow(CatalogCompileError);
	});

	it("rejects hoursPerTick other than one", () => {
		const document = mutate((next) => {
			(next.policies.time as { simulatedHoursPerTick?: number }).simulatedHoursPerTick = 2;
		});

		expect(() => compileCatalog(document)).toThrow(/hours-per-tick|hoursPerTick/);
	});
});

describe("catalog compile - Game boundary", () => {
	it("keeps Game.tick free of compiled catalog and identity imports", () => {
		const gamePath = resolve(dirname(fileURLToPath(import.meta.url)), "../game.ts");
		const source = readFileSync(gamePath, "utf8");

		expect(source.includes("catalog/compile")).toBe(false);
		expect(source.includes("identity/")).toBe(false);
	});
});

function mutate(edit: (document: MutableBaseline) => void): BaselineDocument {
	const document = structuredClone(loadBaselineDocument()) as MutableBaseline;

	edit(document);

	return document;
}

type MutableBaseline = {
	-readonly [K in keyof BaselineDocument]: BaselineDocument[K] extends readonly (infer T)[]
		? T[]
		: BaselineDocument[K];
} & {
	hardware: Array<BaselineDocument["hardware"][number]>;
	policies: BaselineDocument["policies"];
};

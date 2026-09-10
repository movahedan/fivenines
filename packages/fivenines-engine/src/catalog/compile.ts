import { units } from "@packages/shared/units";

import { loadBaselineDocument } from "../baseline/load";
import type { BaselineDocument, BaselineIssue } from "../baseline/types";
import { validateBaseline } from "../baseline/validate";
import type { RuntimeCourse } from "./course-catalog";
import type { RuntimeDemandType } from "./demand-catalog";
import {
	type HardwareDesignAudit,
	networkMiBFromMbps,
	type RuntimeHardware,
} from "./hardware-catalog";
import type { RuntimeTechnology } from "./technology-catalog";

export interface CompiledCatalogTime {
	version: string;
	hoursPerTick: number;
	cpuWorkPerCoreHour: number;
}

export interface CompiledCatalog {
	time: CompiledCatalogTime;
	technologies: readonly RuntimeTechnology[];
	hardware: readonly RuntimeHardware[];
	demandTypes: readonly RuntimeDemandType[];
	courses: readonly RuntimeCourse[];
}

export class CatalogCompileError extends Error {
	readonly name = "CatalogCompileError";
	readonly issues: readonly BaselineIssue[];

	constructor(issues: readonly BaselineIssue[]) {
		super(`catalog compile failed: ${issues.map((issue) => issue.code).join(", ")}`);
		this.issues = issues;
	}
}

export function compileAuthoredCatalog(): CompiledCatalog {
	return compileCatalog(loadBaselineDocument());
}

export function compileCatalog(document: BaselineDocument): CompiledCatalog {
	const baseline = validateBaseline(document);

	if (!baseline.ok) {
		throw new CatalogCompileError(baseline.issues);
	}

	const time = compileTime(document);
	const technologies = compileTechnologies(document);
	const hardware = compileHardware(document, time.cpuWorkPerCoreHour);
	const demandTypes = document.demandTypes.map((row) => ({
		id: row.id,
		policy: row.policy,
		release: row.release,
	}));
	const courses = document.courses.map((row) => ({
		id: row.id,
		name: row.name,
		effect: row.effect,
	}));

	assertUniqueIds(
		"technologies",
		technologies.map((row) => row.id),
	);
	assertUniqueIds(
		"hardware",
		hardware.map((row) => row.id),
	);
	assertUniqueIds(
		"demandTypes",
		demandTypes.map((row) => row.id),
	);
	assertUniqueIds(
		"courses",
		courses.map((row) => row.id),
	);
	assertCompiledGraph(technologies);

	return { time, technologies, hardware, demandTypes, courses };
}

function compileTime(document: BaselineDocument): CompiledCatalogTime {
	const policies = asRecord(document.policies, "policies");
	const time = asRecord(policies.time, "policies.time");
	const resource = asRecord(policies.resource, "policies.resource");

	const hoursPerTick = units.asNonNegativeInteger(
		asFiniteNumber(time.simulatedHoursPerTick, "policies.time.simulatedHoursPerTick"),
		"hoursPerTick",
	);

	if (hoursPerTick !== 1) {
		throw new CatalogCompileError([
			{
				code: "hours-per-tick",
				path: "policies.time.simulatedHoursPerTick",
				message: `hoursPerTick must be 1, got ${hoursPerTick}`,
			},
		]);
	}

	return {
		version: asString(policies.version, "policies.version"),
		hoursPerTick,
		cpuWorkPerCoreHour: units.asNonNegativeInteger(
			asFiniteNumber(resource.cpuWorkPerCoreHour, "policies.resource.cpuWorkPerCoreHour"),
			"cpuWorkPerCoreHour",
		),
	};
}

function compileTechnologies(document: BaselineDocument): readonly RuntimeTechnology[] {
	const byName = new Map(document.technologies.map((row) => [row.name, row]));
	const issues: BaselineIssue[] = [];
	const compiled: RuntimeTechnology[] = [];

	for (const [index, row] of document.technologies.entries()) {
		const prerequisiteIds: string[] = [];

		for (const [prereqIndex, name] of row.prerequisites.entries()) {
			const target = byName.get(name);

			if (target === undefined) {
				issues.push({
					code: "missing-prereq",
					path: `technologies/${index}/prerequisites/${prereqIndex}`,
					message: `unknown technology name: ${name}`,
				});
				continue;
			}

			prerequisiteIds.push(target.id);
		}

		compiled.push({
			id: row.id,
			name: row.name,
			prerequisiteIds,
			release: row.release,
		});
	}

	if (issues.length > 0) {
		throw new CatalogCompileError(issues);
	}

	return compiled;
}

function compileHardware(
	document: BaselineDocument,
	cpuWorkPerCoreHour: number,
): readonly RuntimeHardware[] {
	return document.hardware.map((row, index) => {
		const design = asHardwareDesign(row, index);
		const cpuWork = units.asNonNegativeInteger(
			Math.round(design.cores * design.coreFactor * cpuWorkPerCoreHour),
			`hardware/${index}/cpuWork`,
		);
		const gpuWork = units.asNonNegativeInteger(
			design.gpuCount * design.gpuWorkPerDeviceHour,
			`hardware/${index}/gpuWork`,
		);

		return {
			id: design.id,
			cpuWork,
			gpuWork,
			diskOps: units.asNonNegativeInteger(design.iops, `hardware/${index}/diskOps`),
			networkMiB: networkMiBFromMbps(design.networkMbps),
			residentMemoryMiB: units.asNonNegativeInteger(
				design.ramMiB,
				`hardware/${index}/residentMemoryMiB`,
			),
			queuedMemoryMiB: 0,
			diskCapacityMiB: units.asNonNegativeInteger(
				design.diskGiB * 1024,
				`hardware/${index}/diskCapacityMiB`,
			),
			gpuCount: units.asNonNegativeInteger(design.gpuCount, `hardware/${index}/gpuCount`),
			design,
		};
	});
}

function assertUniqueIds(collection: string, ids: readonly string[]): void {
	const seen = new Set<string>();

	for (const [index, id] of ids.entries()) {
		if (seen.has(id)) {
			throw new CatalogCompileError([
				{
					code: "duplicate-id",
					path: `${collection}/${index}/id`,
					message: `duplicate ${collection} id: ${id}`,
				},
			]);
		}

		seen.add(id);
	}
}

function assertCompiledGraph(technologies: readonly RuntimeTechnology[]): void {
	const byId = new Map(technologies.map((row) => [row.id, row]));
	const issues: BaselineIssue[] = [];
	const visiting = new Set<string>();
	const visited = new Set<string>();

	const walk = (id: string, path: string[]): void => {
		if (visited.has(id)) {
			return;
		}

		if (visiting.has(id)) {
			issues.push({
				code: "cycle",
				path: `technologies/${id}/prerequisiteIds`,
				message: `cycle: ${[...path, id].join(" -> ")}`,
			});
			return;
		}

		const node = byId.get(id);

		if (node === undefined) {
			issues.push({
				code: "missing-prereq",
				path: `technologies/${id}`,
				message: `unknown technology id: ${id}`,
			});
			return;
		}

		visiting.add(id);

		for (const prerequisiteId of node.prerequisiteIds) {
			const prereq = byId.get(prerequisiteId);

			if (prereq === undefined) {
				issues.push({
					code: "missing-prereq",
					path: `technologies/${id}/prerequisiteIds`,
					message: `unknown technology id: ${prerequisiteId}`,
				});
				continue;
			}

			if (node.release === "v1" && prereq.release === "expansion") {
				issues.push({
					code: "v1-depends-expansion",
					path: `technologies/${id}/prerequisiteIds`,
					message: `${id} is v1 and depends on expansion ${prerequisiteId}`,
				});
			}

			walk(prerequisiteId, [...path, id]);
		}

		visiting.delete(id);
		visited.add(id);
	};

	for (const row of technologies) {
		walk(row.id, []);
	}

	if (issues.length > 0) {
		throw new CatalogCompileError(issues);
	}
}

interface HardwareDesignRow extends HardwareDesignAudit {
	id: string;
}

function asHardwareDesign(row: unknown, index: number): HardwareDesignRow {
	const record = asRecord(row, `hardware/${index}`);

	return {
		id: asString(record.id, `hardware/${index}/id`),
		cores: asFiniteNumber(record.cores, `hardware/${index}/cores`),
		coreFactor: asFiniteNumber(record.coreFactor, `hardware/${index}/coreFactor`),
		ramMiB: asFiniteNumber(record.ramMiB, `hardware/${index}/ramMiB`),
		diskGiB: asFiniteNumber(record.diskGiB, `hardware/${index}/diskGiB`),
		networkMbps: asFiniteNumber(record.networkMbps, `hardware/${index}/networkMbps`),
		diskMiBps: asFiniteNumber(record.diskMiBps, `hardware/${index}/diskMiBps`),
		iops: asFiniteNumber(record.iops, `hardware/${index}/iops`),
		gpuCount: asFiniteNumber(record.gpuCount, `hardware/${index}/gpuCount`),
		gpuWorkPerDeviceHour: asFiniteNumber(
			record.gpuWorkPerDeviceHour,
			`hardware/${index}/gpuWorkPerDeviceHour`,
		),
		gpuMemoryMiBPerDevice: asFiniteNumber(
			record.gpuMemoryMiBPerDevice,
			`hardware/${index}/gpuMemoryMiBPerDevice`,
		),
		purchase: asFiniteNumber(record.purchase, `hardware/${index}/purchase`),
		dailyRent: asFiniteNumber(record.dailyRent, `hardware/${index}/dailyRent`),
		maintenancePerHour: asFiniteNumber(
			record.maintenancePerHour,
			`hardware/${index}/maintenancePerHour`,
		),
		idlePowerPerHour: asFiniteNumber(record.idlePowerPerHour, `hardware/${index}/idlePowerPerHour`),
		maxPowerPerHour: asFiniteNumber(record.maxPowerPerHour, `hardware/${index}/maxPowerPerHour`),
	};
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new CatalogCompileError([{ code: "shape", path, message: `${path} must be an object` }]);
	}

	return value as Record<string, unknown>;
}

function asString(value: unknown, path: string): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new CatalogCompileError([{ code: "shape", path, message: `${path} must be a string` }]);
	}

	return value;
}

function asFiniteNumber(value: unknown, path: string): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new CatalogCompileError([
			{ code: "shape", path, message: `${path} must be a finite number` },
		]);
	}

	return value;
}

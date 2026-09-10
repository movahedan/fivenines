import type {
	BaselineCourse,
	BaselineDemandType,
	BaselineDocument,
	BaselineFiniteJob,
	BaselineIssue,
	BaselineProject,
	BaselineReleaseCounts,
	BaselineTechnology,
	BaselineValidationResult,
	ReleaseMarker,
} from "./types";

export const EXPECTED_RELEASE_COUNTS = {
	technologiesV1: 31,
	technologiesExpansion: 12,
	demandTypesV1: 13,
	demandTypesExpansion: 7,
	projectsV1: 9,
	projectsExpansion: 3,
	finiteJobsV1: 2,
	finiteJobsExpansion: 3,
} as const satisfies BaselineReleaseCounts;

export const COURSE_EFFECT_IDS = [
	"configurationIncidentProbability",
	"installationAndConfigurationWork",
	"diagnosisAndRepairWork",
	"softwareCpuAndGpuWork",
	"restoreProcessingWork",
] as const;

const MIX_SCALE = 1_000_000;

export function validateBaseline(document: BaselineDocument): BaselineValidationResult {
	const issues: BaselineIssue[] = [];

	pushUnique(
		issues,
		"technologies",
		"id",
		document.technologies.map((row) => row.id),
	);
	pushUnique(
		issues,
		"technologies",
		"name",
		document.technologies.map((row) => row.name),
	);
	pushUnique(
		issues,
		"hardware",
		"id",
		document.hardware.map((row) => row.id),
	);
	pushUnique(
		issues,
		"demandTypes",
		"id",
		document.demandTypes.map((row) => row.id),
	);
	pushUnique(
		issues,
		"projects",
		"id",
		document.projects.map((row) => row.id),
	);
	pushUnique(
		issues,
		"courses",
		"id",
		document.courses.map((row) => row.id),
	);
	pushUnique(
		issues,
		"courses",
		"name",
		document.courses.map((row) => row.name),
	);

	const technologyByName = indexBy(document.technologies, (row) => row.name);
	const demandById = indexBy(document.demandTypes, (row) => row.id);
	const courseByName = indexBy(document.courses, (row) => row.name);
	const rhythmIds = new Set(Object.keys(document.policies.demand.rhythms));
	const variationIds = new Set(Object.keys(document.policies.demand.variation));

	assertDag(issues, document.technologies, technologyByName);
	assertV1DoesNotDependOnExpansion(issues, document.technologies, technologyByName);
	assertProjects(issues, document.projects, demandById, technologyByName, rhythmIds, variationIds);
	assertFiniteJobs(issues, document.policies.contract.finiteJobs, demandById);
	assertPolicyGuards(issues, document);
	assertCourseEffects(issues, document.courses);
	assertDuplicateSkill(
		issues,
		document.policies.operations.duplicatePreparationSkill,
		courseByName,
	);

	const counts = countReleases(document);

	if (!sameCounts(counts, EXPECTED_RELEASE_COUNTS)) {
		issues.push({
			code: "release-counts",
			path: "/",
			message: `release membership drifted: ${JSON.stringify(counts)}`,
		});
	}

	return { ok: issues.length === 0, issues, counts };
}

function pushUnique(
	issues: BaselineIssue[],
	collection: string,
	field: string,
	values: readonly string[],
): void {
	const seen = new Set<string>();

	for (const [index, value] of values.entries()) {
		if (seen.has(value)) {
			issues.push({
				code: "duplicate-id",
				path: `${collection}[${index}].${field}`,
				message: `duplicate ${collection} ${field}: ${value}`,
			});
			continue;
		}

		seen.add(value);
	}
}

function indexBy<T>(rows: readonly T[], keyOf: (row: T) => string): Map<string, T> {
	const map = new Map<string, T>();

	for (const row of rows) {
		map.set(keyOf(row), row);
	}

	return map;
}

function assertDag(
	issues: BaselineIssue[],
	technologies: readonly BaselineTechnology[],
	byName: Map<string, BaselineTechnology>,
): void {
	for (const [index, technology] of technologies.entries()) {
		for (const [prereqIndex, name] of technology.prerequisites.entries()) {
			if (!byName.has(name)) {
				issues.push({
					code: "missing-prereq",
					path: `technologies[${index}].prerequisites[${prereqIndex}]`,
					message: `unknown prerequisite: ${name}`,
				});
			}
		}
	}

	const visiting = new Set<string>();
	const visited = new Set<string>();

	const visit = (name: string, trail: readonly string[]): void => {
		if (visited.has(name)) {
			return;
		}

		if (visiting.has(name)) {
			issues.push({
				code: "cycle",
				path: "technologies",
				message: `cyclic prerequisite: ${[...trail, name].join(" -> ")}`,
			});
			return;
		}

		const node = byName.get(name);

		if (node === undefined) {
			return;
		}

		visiting.add(name);

		for (const prerequisite of node.prerequisites) {
			visit(prerequisite, [...trail, name]);
		}

		visiting.delete(name);
		visited.add(name);
	};

	for (const technology of technologies) {
		visit(technology.name, []);
	}
}

function assertV1DoesNotDependOnExpansion(
	issues: BaselineIssue[],
	technologies: readonly BaselineTechnology[],
	byName: Map<string, BaselineTechnology>,
): void {
	for (const [index, technology] of technologies.entries()) {
		if (technology.release !== "v1") {
			continue;
		}

		for (const [prereqIndex, name] of technology.prerequisites.entries()) {
			const prerequisite = byName.get(name);

			if (prerequisite?.release === "expansion") {
				issues.push({
					code: "v1-depends-expansion",
					path: `technologies[${index}].prerequisites[${prereqIndex}]`,
					message: `${technology.name} is v1 but requires expansion ${name}`,
				});
			}
		}
	}
}

function assertProjects(
	issues: BaselineIssue[],
	projects: readonly BaselineProject[],
	demandById: Map<string, BaselineDemandType>,
	technologyByName: Map<string, BaselineTechnology>,
	rhythmIds: ReadonlySet<string>,
	variationIds: ReadonlySet<string>,
): void {
	for (const [index, project] of projects.entries()) {
		if (!rhythmIds.has(project.rhythm)) {
			issues.push({
				code: "unknown-rhythm",
				path: `projects[${index}].rhythm`,
				message: `unknown rhythm: ${project.rhythm}`,
			});
		}

		if (!variationIds.has(project.variation)) {
			issues.push({
				code: "unknown-variation",
				path: `projects[${index}].variation`,
				message: `unknown variation: ${project.variation}`,
			});
		}

		const weights: number[] = [];

		for (const [demandId, weight] of Object.entries(project.mix)) {
			weights.push(weight);
			const demand = demandById.get(demandId);

			if (demand === undefined) {
				issues.push({
					code: "unknown-demand",
					path: `projects[${index}].mix.${demandId}`,
					message: `unknown demand type: ${demandId}`,
				});
				continue;
			}

			if (!Number.isFinite(weight) || weight < 0) {
				issues.push({
					code: "invalid-mix-weight",
					path: `projects[${index}].mix.${demandId}`,
					message: `mix weight must be finite and >= 0: ${weight}`,
				});
			}

			if (project.release === "v1" && demand.release === "expansion") {
				issues.push({
					code: "v1-depends-expansion",
					path: `projects[${index}].mix.${demandId}`,
					message: `${project.id} is v1 but mix cites expansion ${demandId}`,
				});
			}
		}

		if (!mixSumsToOne(weights)) {
			issues.push({
				code: "mix-sum",
				path: `projects[${index}].mix`,
				message: `${project.id} mix does not sum to 1`,
			});
		}

		for (const [techIndex, name] of project.technologies.entries()) {
			const technology = technologyByName.get(name);

			if (technology === undefined) {
				issues.push({
					code: "unknown-technology",
					path: `projects[${index}].technologies[${techIndex}]`,
					message: `unknown technology: ${name}`,
				});
				continue;
			}

			if (project.release === "v1" && technology.release === "expansion") {
				issues.push({
					code: "v1-depends-expansion",
					path: `projects[${index}].technologies[${techIndex}]`,
					message: `${project.id} is v1 but requires expansion ${name}`,
				});
			}
		}
	}
}

function assertFiniteJobs(
	issues: BaselineIssue[],
	jobs: readonly BaselineFiniteJob[],
	demandById: Map<string, BaselineDemandType>,
): void {
	for (const [index, job] of jobs.entries()) {
		const demand = demandById.get(job.demand);

		if (demand === undefined) {
			issues.push({
				code: "unknown-demand",
				path: `policies.contract.finiteJobs[${index}].demand`,
				message: `unknown finite-job demand: ${job.demand}`,
			});
			continue;
		}

		if (job.release === "v1" && demand.release === "expansion") {
			issues.push({
				code: "v1-depends-expansion",
				path: `policies.contract.finiteJobs[${index}].demand`,
				message: `v1 finite job cites expansion demand ${job.demand}`,
			});
		}
	}
}

function assertPolicyGuards(issues: BaselineIssue[], document: BaselineDocument): void {
	const { policies } = document;

	expectEqual(issues, "policies.time.internalSubticks", policies.time.internalSubticks, 0);
	expectEqual(issues, "policies.queue.automaticRetries", policies.queue.automaticRetries, 0);
	expectEqual(issues, "policies.operations.powerOnHours", policies.operations.powerOnHours, 0);
	expectEqual(
		issues,
		"policies.learning.sharedConcurrentSlots",
		policies.learning.sharedConcurrentSlots,
		2,
	);
	expectEqual(
		issues,
		"policies.observation.alertOnMonitoringOutage",
		policies.observation.alertOnMonitoringOutage,
		false,
	);
	expectEqual(
		issues,
		"policies.observation.backfillMonitoringGaps",
		policies.observation.backfillMonitoringGaps,
		false,
	);
	expectEqual(
		issues,
		"policies.release.expansionEnabled",
		policies.release.expansionEnabled,
		false,
	);

	if (typeof policies.economy.salvageFraction !== "number") {
		issues.push({
			code: "policy-guard",
			path: "policies.economy.salvageFraction",
			message: "salvageFraction is required",
		});
	}
}

function assertCourseEffects(issues: BaselineIssue[], courses: readonly BaselineCourse[]): void {
	const allowed = new Set<string>(COURSE_EFFECT_IDS);

	for (const [index, course] of courses.entries()) {
		if (!allowed.has(course.effect)) {
			issues.push({
				code: "unknown-course-effect",
				path: `courses[${index}].effect`,
				message: `unknown course effect: ${course.effect}`,
			});
		}
	}
}

function assertDuplicateSkill(
	issues: BaselineIssue[],
	skill: string,
	courseByName: Map<string, BaselineCourse>,
): void {
	if (!courseByName.has(skill)) {
		issues.push({
			code: "unknown-course",
			path: "policies.operations.duplicatePreparationSkill",
			message: `unknown course name: ${skill}`,
		});
	}
}

function mixSumsToOne(weights: readonly number[]): boolean {
	const scaled = weights.reduce((sum, weight) => sum + Math.round(weight * MIX_SCALE), 0);

	return scaled === MIX_SCALE;
}

function countReleases(document: BaselineDocument): BaselineReleaseCounts {
	return {
		technologiesV1: countMarker(document.technologies, "v1"),
		technologiesExpansion: countMarker(document.technologies, "expansion"),
		demandTypesV1: countMarker(document.demandTypes, "v1"),
		demandTypesExpansion: countMarker(document.demandTypes, "expansion"),
		projectsV1: countMarker(document.projects, "v1"),
		projectsExpansion: countMarker(document.projects, "expansion"),
		finiteJobsV1: countMarker(document.policies.contract.finiteJobs, "v1"),
		finiteJobsExpansion: countMarker(document.policies.contract.finiteJobs, "expansion"),
	};
}

function countMarker(rows: readonly { release: ReleaseMarker }[], marker: ReleaseMarker): number {
	return rows.filter((row) => row.release === marker).length;
}

function sameCounts(left: BaselineReleaseCounts, right: BaselineReleaseCounts): boolean {
	return (
		left.technologiesV1 === right.technologiesV1 &&
		left.technologiesExpansion === right.technologiesExpansion &&
		left.demandTypesV1 === right.demandTypesV1 &&
		left.demandTypesExpansion === right.demandTypesExpansion &&
		left.projectsV1 === right.projectsV1 &&
		left.projectsExpansion === right.projectsExpansion &&
		left.finiteJobsV1 === right.finiteJobsV1 &&
		left.finiteJobsExpansion === right.finiteJobsExpansion
	);
}

function expectEqual<T>(issues: BaselineIssue[], path: string, actual: T, expected: T): void {
	if (actual !== expected) {
		issues.push({
			code: "policy-guard",
			path,
			message: `expected ${String(expected)}, got ${String(actual)}`,
		});
	}
}

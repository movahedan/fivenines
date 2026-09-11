import { tuitionCents } from "./learning-policy";

export interface CourseLevel {
	readonly level: number;
	readonly durationHours: number;
	readonly monthlyTuitionCents: number;
	readonly cumulativeFactorMicro: number;
}

export interface CourseEntry {
	readonly id: string;
	readonly name: string;
	readonly effect: string;
	readonly factorPerLevelMicro: number;
	readonly levels: readonly CourseLevel[];
}

function level(
	levelNumber: number,
	durationHours: number,
	monthlyTuition: number,
	cumulativeFactor: number,
): CourseLevel {
	return {
		level: levelNumber,
		durationHours,
		monthlyTuitionCents: tuitionCents(monthlyTuition),
		cumulativeFactorMicro: Math.round(cumulativeFactor * 1_000_000),
	};
}

function course(
	id: string,
	name: string,
	effect: string,
	factorPerLevel: number,
	tuitions: readonly [number, number, number, number, number],
	cumulatives: readonly [number, number, number, number, number],
): CourseEntry {
	return {
		id,
		name,
		effect,
		factorPerLevelMicro: Math.round(factorPerLevel * 1_000_000),
		levels: [1, 2, 3, 4, 5].map((levelNumber, index) =>
			level(levelNumber, 168 * levelNumber, tuitions[index] ?? 0, cumulatives[index] ?? 0),
		),
	};
}

export const COURSE_CATALOG: Record<string, CourseEntry> = {
	"system-administration": course(
		"system-administration",
		"System Administration",
		"configurationIncidentProbability",
		0.9,
		[20, 25, 30, 35, 40],
		[0.9, 0.81, 0.729, 0.6561, 0.59049],
	),
	"deployment-automation": course(
		"deployment-automation",
		"Deployment Automation",
		"installationAndConfigurationWork",
		0.92,
		[20, 25, 30, 35, 40],
		[0.92, 0.8464, 0.778688, 0.71639296, 0.65908152],
	),
	"incident-response": course(
		"incident-response",
		"Incident Response",
		"diagnosisAndRepairWork",
		0.9,
		[25, 32, 38, 44, 50],
		[0.9, 0.81, 0.729, 0.6561, 0.59049],
	),
	"performance-tuning": course(
		"performance-tuning",
		"Performance Tuning",
		"applicationCpuAndGpuWork",
		0.95,
		[35, 44, 53, 62, 70],
		[0.95, 0.9025, 0.857375, 0.81450625, 0.7737809375],
	),
	"data-recovery": course(
		"data-recovery",
		"Data Recovery",
		"restorePreparationAndProcessingWork",
		0.9,
		[25, 32, 38, 44, 50],
		[0.9, 0.81, 0.729, 0.6561, 0.59049],
	),
};

export function courseById(id: string): CourseEntry {
	const entry = COURSE_CATALOG[id];

	if (entry === undefined) {
		throw new Error(`unknown course: ${id}`);
	}

	return entry;
}

export function courseLevel(id: string, levelNumber: number): CourseLevel {
	const found = courseById(id).levels.find((entry) => entry.level === levelNumber);

	if (found === undefined) {
		throw new Error(`unknown course level: ${id} ${String(levelNumber)}`);
	}

	return found;
}

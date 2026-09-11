import type { LearningCatalogRow } from "@packages/fivenines-engine";
import { COURSE_CATALOG, RESEARCH_CATALOG } from "@packages/fivenines-engine";
import { formatters } from "@packages/shared/formatters";

import type {
	GameLearningCourseItem,
	GameLearningOngoingItem,
	GameLearningTechnologyItem,
} from "@/molecules/game-learning-panel/game-learning-panel";

const SIM_HOURS_PER_WEEK = 168;

function techFamily(id: string): string {
	if (id.includes("backup")) {
		return "Data";
	}

	if (id.includes("restart")) {
		return "Reliability";
	}

	if (
		id.includes("database") ||
		id.includes("cache") ||
		id.includes("replication") ||
		id.includes("failover")
	) {
		return "Database";
	}

	if (id.includes("monitor") || id.includes("health-checks") || id.includes("quality-checks")) {
		return "Observability";
	}

	if (id.includes("proxy") || id.includes("load-balancing") || id.includes("dns")) {
		return "Routing";
	}

	return "Application";
}

function durationLabel(hours: number): string {
	if (hours > 0 && hours % SIM_HOURS_PER_WEEK === 0) {
		return `${String(hours / SIM_HOURS_PER_WEEK)}w`;
	}

	return `${String(hours)}h`;
}

function researchName(id: string): string {
	return RESEARCH_CATALOG[id]?.name ?? id;
}

export function learningTechnologies(
	rows: readonly LearningCatalogRow[],
	jailed: boolean,
): readonly GameLearningTechnologyItem[] {
	return rows
		.filter((row) => row.kind === "research")
		.map((row) => {
			const entry = RESEARCH_CATALOG[row.id];

			return {
				id: row.id,
				name: row.name,
				family: techFamily(row.id),
				status: row.status,
				description: row.note,
				requires: (entry?.prerequisiteIds ?? []).map(researchName),
				researchHours: row.durationHours > 0 ? row.durationHours : undefined,
				tuitionLabel:
					row.durationHours > 0 ? `${formatters.cents(row.monthlyTuitionCents)}/mo` : undefined,
				enrollmentId: row.enrollmentId,
				enrollDisabled: jailed || row.status === "insufficient-funds",
			};
		});
}

export function learningCourses(
	rows: readonly LearningCatalogRow[],
	jailed: boolean,
): readonly GameLearningCourseItem[] {
	return Object.values(COURSE_CATALOG).map((entry) => {
		const row = rows.find(
			(item) =>
				item.kind === "course" &&
				item.subject.kind === "course" &&
				item.subject.courseId === entry.id,
		);
		const currentLevel =
			row?.status === "completed" ? 5 : row?.subject.kind === "course" ? row.subject.level - 1 : 0;

		return {
			id: entry.id,
			name: entry.name,
			mark: entry.id.slice(0, 2).toUpperCase(),
			status: row?.status ?? "available",
			currentLevel: Math.max(0, currentLevel),
			maxLevel: 5,
			effect: entry.effect,
			tuitionLabel:
				row === undefined || row.status === "completed"
					? formatters.cents(0)
					: `${formatters.cents(row.monthlyTuitionCents)}/mo`,
			durationLabel:
				row === undefined || row.status === "completed" ? "—" : durationLabel(row.durationHours),
			enrollmentId: row?.enrollmentId,
			enrollDisabled: jailed || row?.status === "insufficient-funds" || row?.status === "completed",
		};
	});
}

export function learningOngoing(
	technologies: readonly GameLearningTechnologyItem[],
	courses: readonly GameLearningCourseItem[],
): readonly GameLearningOngoingItem[] {
	const activeTech = technologies
		.filter((item) => item.status === "active")
		.map((item) => ({
			id: item.id,
			name: item.name,
			detail: item.family,
			mark: item.family.slice(0, 1).toUpperCase(),
		}));
	const activeCourses = courses
		.filter((item) => item.status === "active")
		.map((item) => ({
			id: item.id,
			name: item.name,
			detail: `Level ${String(item.currentLevel)}`,
			mark: item.mark,
		}));

	return [...activeTech, ...activeCourses];
}

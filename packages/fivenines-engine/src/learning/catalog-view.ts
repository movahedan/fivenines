import { COURSE_CATALOG } from "../catalog/course-catalog";
import { LEARNING_POLICY } from "../catalog/learning-policy";
import { RESEARCH_CATALOG } from "../catalog/research-catalog";
import type { LearningSnapshot, LearningSubject } from "./board";

export type LearningRowStatus =
	| "locked"
	| "available"
	| "insufficient-funds"
	| "active"
	| "paused"
	| "completed";

export interface LearningCatalogRow {
	readonly id: string;
	readonly name: string;
	readonly kind: "research" | "course";
	readonly subject: LearningSubject;
	readonly status: LearningRowStatus;
	readonly durationHours: number;
	readonly monthlyTuitionCents: number;
	readonly enrollmentId?: string;
	readonly progressHours?: number;
	readonly note: string;
}

export function learningCatalog(
	snapshot: LearningSnapshot,
	cashCents: number,
): readonly LearningCatalogRow[] {
	const researchRows = Object.values(RESEARCH_CATALOG)
		.filter((entry) => entry.release === "v1")
		.map((entry) => {
			const subject: LearningSubject = { kind: "research", technologyId: entry.id };
			const enrollment = snapshot.enrollments.find(
				(item) => item.subject.kind === "research" && item.subject.technologyId === entry.id,
			);
			const completed = snapshot.completedTechnologyIds.includes(entry.id);
			const prereqMissing = entry.prerequisiteIds.some(
				(id) => !snapshot.completedTechnologyIds.includes(id),
			);
			const status = rowStatus(
				completed,
				enrollment,
				prereqMissing,
				cashCents,
				entry.monthlyTuitionCents,
			);

			return {
				id: entry.id,
				name: entry.name,
				kind: "research" as const,
				subject,
				status,
				durationHours: entry.durationHours,
				monthlyTuitionCents: entry.monthlyTuitionCents,
				enrollmentId: enrollment?.id,
				progressHours: enrollment?.progressHours,
				note: effectNote(
					status,
					"Unlocks later install and observation consumers; not simulated here.",
				),
			};
		});

	const courseRows: LearningCatalogRow[] = [];

	for (const entry of Object.values(COURSE_CATALOG)) {
		const completedLevel = snapshot.completedCourseLevels[entry.id] ?? 0;

		if (completedLevel >= 5) {
			courseRows.push({
				id: `${entry.id}-complete`,
				name: `${entry.name} L5`,
				kind: "course",
				subject: { kind: "course", courseId: entry.id, level: 5 },
				status: "completed",
				durationHours: 840,
				monthlyTuitionCents: 0,
				note: "Completed course level (active enrollments are separate).",
			});
			continue;
		}

		const nextLevel = completedLevel + 1;
		const level = entry.levels.find((item) => item.level === nextLevel);

		if (level === undefined) {
			continue;
		}

		const subject: LearningSubject = { kind: "course", courseId: entry.id, level: nextLevel };
		const enrollment = snapshot.enrollments.find(
			(item) =>
				item.subject.kind === "course" &&
				item.subject.courseId === entry.id &&
				item.subject.level === nextLevel,
		);
		const status = rowStatus(false, enrollment, false, cashCents, level.monthlyTuitionCents);

		courseRows.push({
			id: `${entry.id}-${String(nextLevel)}`,
			name: `${entry.name} L${String(nextLevel)}`,
			kind: "course",
			subject,
			status,
			durationHours: level.durationHours,
			monthlyTuitionCents: level.monthlyTuitionCents,
			enrollmentId: enrollment?.id,
			progressHours: enrollment?.progressHours,
			note: `Completed levels: ${String(completedLevel)}/5. Effect stored, not applied to missing consumers.`,
		});
	}

	return [...researchRows, ...courseRows];
}

export function learningSlotLabel(snapshot: LearningSnapshot): string {
	return `${String(snapshot.slotsUsed)}/${String(LEARNING_POLICY.sharedConcurrentSlots)}`;
}

function rowStatus(
	completed: boolean,
	enrollment: LearningSnapshot["enrollments"][number] | undefined,
	locked: boolean,
	cashCents: number,
	tuitionCents: number,
): LearningRowStatus {
	if (completed || enrollment?.status === "completed") {
		return "completed";
	}

	if (enrollment?.status === "active") {
		return "active";
	}

	if (enrollment?.status === "paused") {
		return enrollment.pauseReason === "insufficient-funds" ? "insufficient-funds" : "paused";
	}

	if (locked) {
		return "locked";
	}

	if (cashCents < tuitionCents) {
		return "insufficient-funds";
	}

	return "available";
}

function effectNote(status: LearningRowStatus, fallback: string): string {
	if (status === "locked") {
		return "Prerequisites not completed.";
	}

	return fallback;
}

import { courseLevel } from "../catalog/course-catalog";
import { LEARNING_POLICY } from "../catalog/learning-policy";
import { BASE_RESEARCH_IDS, researchById } from "../catalog/research-catalog";

export type LearningSubject =
	| { readonly kind: "research"; readonly technologyId: string }
	| { readonly kind: "course"; readonly courseId: string; readonly level: number };

export type EnrollmentStatus = "active" | "paused" | "completed";

export interface Enrollment {
	readonly id: string;
	readonly subject: LearningSubject;
	readonly status: EnrollmentStatus;
	readonly progressHours: number;
	readonly durationHours: number;
	readonly monthlyTuitionCents: number;
	readonly enrolledHour: number;
	readonly paidThroughHour: number;
	readonly pauseReason?: "insufficient-funds" | "voluntary";
}

export interface LearningSnapshot {
	readonly slotsUsed: number;
	readonly enrollments: readonly Enrollment[];
	readonly completedTechnologyIds: readonly string[];
	readonly completedCourseLevels: Readonly<Record<string, number>>;
}

function subjectKey(subject: LearningSubject): string {
	if (subject.kind === "research") {
		return `research:${subject.technologyId}`;
	}

	return `course:${subject.courseId}:${String(subject.level)}`;
}

function describeSubject(subject: LearningSubject): {
	durationHours: number;
	tuitionCents: number;
} {
	if (subject.kind === "research") {
		const entry = researchById(subject.technologyId);

		if (entry.release === "expansion") {
			throw new Error(`expansion research is disabled: ${subject.technologyId}`);
		}

		return { durationHours: entry.durationHours, tuitionCents: entry.monthlyTuitionCents };
	}

	const entry = courseLevel(subject.courseId, subject.level);

	return { durationHours: entry.durationHours, tuitionCents: entry.monthlyTuitionCents };
}

export class LearningBoard {
	#enrollments: Enrollment[] = [];
	#completedTechnologyIds = new Set<string>(BASE_RESEARCH_IDS);
	#completedCourseLevels: Record<string, number> = {};
	#sequence = 1;

	snapshot(): LearningSnapshot {
		return {
			slotsUsed: this.#activeCount(),
			enrollments: [...this.#enrollments],
			completedTechnologyIds: [...this.#completedTechnologyIds],
			completedCourseLevels: { ...this.#completedCourseLevels },
		};
	}

	enroll(subject: LearningSubject, hourIndex: number, cashCents: number): number {
		const spec = describeSubject(subject);

		if (spec.durationHours === 0) {
			throw new Error("base research does not enroll");
		}

		if (this.#activeCount() >= LEARNING_POLICY.sharedConcurrentSlots) {
			throw new Error("learning slots are full");
		}

		this.#assertCanStart(subject);

		if (cashCents < spec.tuitionCents) {
			throw new Error(`insufficient cash: ${String(spec.tuitionCents)}`);
		}

		this.#enrollments.push({
			id: `learn-${String(this.#sequence)}`,
			subject,
			status: "active",
			progressHours: 0,
			durationHours: spec.durationHours,
			monthlyTuitionCents: spec.tuitionCents,
			enrolledHour: hourIndex,
			paidThroughHour: hourIndex + LEARNING_POLICY.monthHours,
		});
		this.#sequence += 1;

		return spec.tuitionCents;
	}

	pause(enrollmentId: string, reason: "insufficient-funds" | "voluntary"): void {
		const enrollment = this.#require(enrollmentId);

		if (enrollment.status !== "active") {
			throw new Error(`enrollment is not active: ${enrollmentId}`);
		}

		this.#replace({ ...enrollment, status: "paused", pauseReason: reason });
	}

	resume(enrollmentId: string, hourIndex: number, cashCents: number): number {
		const enrollment = this.#require(enrollmentId);

		if (enrollment.status !== "paused") {
			throw new Error(`enrollment is not paused: ${enrollmentId}`);
		}

		if (this.#activeCount() >= LEARNING_POLICY.sharedConcurrentSlots) {
			throw new Error("learning slots are full");
		}

		const withinPaidCoverage = hourIndex < enrollment.paidThroughHour;
		const needsPayment = enrollment.pauseReason === "insufficient-funds" || !withinPaidCoverage;

		if (needsPayment && cashCents < enrollment.monthlyTuitionCents) {
			throw new Error(`insufficient cash: ${String(enrollment.monthlyTuitionCents)}`);
		}

		const paidThroughHour = needsPayment
			? hourIndex + LEARNING_POLICY.monthHours
			: enrollment.paidThroughHour;
		const tuition = needsPayment ? enrollment.monthlyTuitionCents : 0;

		this.#replace({
			...enrollment,
			status: "active",
			paidThroughHour,
			pauseReason: undefined,
		});

		return tuition;
	}

	cancel(enrollmentId: string): void {
		const enrollment = this.#require(enrollmentId);

		if (enrollment.status === "completed") {
			throw new Error(`enrollment is completed: ${enrollmentId}`);
		}

		this.#replace({
			...enrollment,
			status: "paused",
			pauseReason: "voluntary",
		});
	}

	tick(hourIndex: number, cashCents: number): number {
		let cashDelta = 0;
		let remainingCash = cashCents;

		for (const enrollment of [...this.#enrollments]) {
			if (enrollment.status !== "active") {
				continue;
			}

			const progressed: Enrollment = {
				...enrollment,
				progressHours: enrollment.progressHours + 1,
			};

			if (progressed.progressHours >= enrollment.durationHours) {
				this.#complete(progressed);
				continue;
			}

			const nextHour = hourIndex + 1;

			if (nextHour === enrollment.paidThroughHour) {
				if (remainingCash < enrollment.monthlyTuitionCents) {
					this.#replace({
						...progressed,
						status: "paused",
						pauseReason: "insufficient-funds",
					});
					continue;
				}

				cashDelta -= enrollment.monthlyTuitionCents;
				remainingCash -= enrollment.monthlyTuitionCents;
				this.#replace({
					...progressed,
					paidThroughHour: enrollment.paidThroughHour + LEARNING_POLICY.monthHours,
				});
				continue;
			}

			this.#replace(progressed);
		}

		return cashDelta;
	}

	#complete(enrollment: Enrollment): void {
		this.#replace({ ...enrollment, status: "completed" });

		if (enrollment.subject.kind === "research") {
			this.#completedTechnologyIds.add(enrollment.subject.technologyId);
			return;
		}

		this.#completedCourseLevels[enrollment.subject.courseId] = enrollment.subject.level;
	}

	#assertCanStart(subject: LearningSubject): void {
		if (
			this.#enrollments.some(
				(enrollment) =>
					subjectKey(enrollment.subject) === subjectKey(subject) &&
					enrollment.status !== "completed",
			)
		) {
			throw new Error(`already enrolled: ${subjectKey(subject)}`);
		}

		if (subject.kind === "research") {
			const entry = researchById(subject.technologyId);

			if (this.#completedTechnologyIds.has(subject.technologyId)) {
				throw new Error(`research already completed: ${subject.technologyId}`);
			}

			for (const prerequisiteId of entry.prerequisiteIds) {
				if (!this.#completedTechnologyIds.has(prerequisiteId)) {
					throw new Error(`research prerequisite missing: ${prerequisiteId}`);
				}
			}

			return;
		}

		const completed = this.#completedCourseLevels[subject.courseId] ?? 0;

		if (subject.level !== completed + 1) {
			throw new Error(`course level locked: ${subject.courseId} ${String(subject.level)}`);
		}

		if (subject.level > 5) {
			throw new Error(`course level cap: ${subject.courseId}`);
		}
	}

	#activeCount(): number {
		return this.#enrollments.filter((enrollment) => enrollment.status === "active").length;
	}

	#require(enrollmentId: string): Enrollment {
		const enrollment = this.#enrollments.find((entry) => entry.id === enrollmentId);

		if (enrollment === undefined) {
			throw new Error(`unknown enrollment: ${enrollmentId}`);
		}

		return enrollment;
	}

	#replace(next: Enrollment): void {
		this.#enrollments = this.#enrollments.map((enrollment) =>
			enrollment.id === next.id ? next : enrollment,
		);
	}
}

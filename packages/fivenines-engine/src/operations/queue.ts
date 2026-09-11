import { courseLevel } from "../catalog/course-catalog";
import {
	DEPLOYMENT_AUTOMATION_COURSE_ID,
	OPERATIONAL_PROGRESS_MILLI_PER_HOUR,
	OPERATIONAL_SLOT_COUNT,
	setupTaskDurationHours,
	setupTaskPrerequisites,
} from "../catalog/operations-policy";

export type OperationalTaskStatus = "active" | "completed" | "cancelled";

export interface OperationalTask {
	readonly id: string;
	readonly projectId: string;
	readonly taskId: string;
	readonly status: OperationalTaskStatus;
	readonly progressMilliHours: number;
	readonly durationMilliHours: number;
}

export interface OperationalSnapshot {
	readonly slotsUsed: number;
	readonly tasks: readonly OperationalTask[];
}

function skillFactorMicro(completedCourseLevels: Readonly<Record<string, number>>): number {
	const level = completedCourseLevels[DEPLOYMENT_AUTOMATION_COURSE_ID] ?? 0;

	if (level === 0) {
		return 1_000_000;
	}

	return courseLevel(DEPLOYMENT_AUTOMATION_COURSE_ID, level).cumulativeFactorMicro;
}

export function skillAdjustedDurationMilliHours(
	taskId: string,
	completedCourseLevels: Readonly<Record<string, number>>,
): number {
	const hours = setupTaskDurationHours(taskId);
	const factorMicro = skillFactorMicro(completedCourseLevels);

	return Math.round((hours * 1_000 * factorMicro) / 1_000_000);
}

export class OperationalQueue {
	#tasks: OperationalTask[] = [];
	#sequence = 1;

	snapshot(): OperationalSnapshot {
		return {
			slotsUsed: this.#activeCount(),
			tasks: [...this.#tasks],
		};
	}

	enqueue(
		projectId: string,
		taskId: string,
		completedCourseLevels: Readonly<Record<string, number>>,
	): string {
		if (this.#activeCount() >= OPERATIONAL_SLOT_COUNT) {
			throw new Error("operational slot is full");
		}

		const duplicate = this.#tasks.find(
			(task) =>
				task.projectId === projectId && task.taskId === taskId && task.status !== "cancelled",
		);

		if (duplicate !== undefined) {
			throw new Error(`setup task already queued: ${taskId}`);
		}

		for (const prerequisiteId of setupTaskPrerequisites(taskId)) {
			if (!this.completedTaskIds(projectId).includes(prerequisiteId)) {
				throw new Error(`setup prerequisite missing: ${prerequisiteId}`);
			}
		}

		const retained = this.#tasks.find(
			(task) =>
				task.projectId === projectId && task.taskId === taskId && task.status === "cancelled",
		);
		const durationMilliHours = skillAdjustedDurationMilliHours(taskId, completedCourseLevels);
		const id = `ops-${String(this.#sequence)}`;
		this.#sequence += 1;
		this.#tasks.push({
			id,
			projectId,
			taskId,
			status: "active",
			progressMilliHours: retained?.progressMilliHours ?? 0,
			durationMilliHours,
		});

		return id;
	}

	cancel(taskId: string): void {
		const current = this.#tasks.find((task) => task.id === taskId);

		if (current === undefined) {
			throw new Error(`unknown operational task: ${taskId}`);
		}

		if (current.status !== "active") {
			throw new Error(`operational task is not active: ${taskId}`);
		}

		this.#tasks = this.#tasks.map((task) =>
			task.id === taskId ? { ...task, status: "cancelled" } : task,
		);
	}

	tick(): readonly string[] {
		const completedProjectIds: string[] = [];

		this.#tasks = this.#tasks.map((task) => {
			if (task.status !== "active") {
				return task;
			}

			const progressMilliHours = Math.min(
				task.durationMilliHours,
				task.progressMilliHours + OPERATIONAL_PROGRESS_MILLI_PER_HOUR,
			);

			if (progressMilliHours < task.durationMilliHours) {
				return { ...task, progressMilliHours };
			}

			completedProjectIds.push(task.projectId);

			return { ...task, progressMilliHours, status: "completed" };
		});

		return completedProjectIds;
	}

	completedTaskIds(projectId: string): readonly string[] {
		return this.#tasks
			.filter((task) => task.projectId === projectId && task.status === "completed")
			.map((task) => task.taskId);
	}

	#activeCount(): number {
		return this.#tasks.filter((task) => task.status === "active").length;
	}

	dropVolatileProgress(projectId: string): void {
		this.#tasks = this.#tasks.map((task) => {
			if (task.projectId !== projectId || task.status !== "active") {
				return task;
			}

			return { ...task, progressMilliHours: 0 };
		});
	}
}

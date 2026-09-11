export const OPERATIONAL_SLOT_COUNT = 1;
export const OPERATIONAL_PROGRESS_MILLI_PER_HOUR = 1_000;
export const DEPLOYMENT_AUTOMATION_COURSE_ID = "deployment-automation";

export const FIRST_PROJECT_SETUP_TASKS = [
	{ id: "install-application-runtime", durationHours: 2 },
	{ id: "install-relational-database", durationHours: 2 },
	{ id: "configure-shared-connection", durationHours: 1 },
] as const;

export type FirstProjectSetupTaskId = (typeof FIRST_PROJECT_SETUP_TASKS)[number]["id"];

export function firstProjectSetupTaskIds(): readonly FirstProjectSetupTaskId[] {
	return FIRST_PROJECT_SETUP_TASKS.map((task) => task.id);
}

export function setupTaskDurationHours(taskId: string): number {
	const task = FIRST_PROJECT_SETUP_TASKS.find((entry) => entry.id === taskId);

	if (task === undefined) {
		throw new Error(`unknown setup task: ${taskId}`);
	}

	return task.durationHours;
}

export function setupTaskPrerequisites(taskId: string): readonly FirstProjectSetupTaskId[] {
	if (taskId === "configure-shared-connection") {
		return ["install-application-runtime", "install-relational-database"];
	}

	setupTaskDurationHours(taskId);

	return [];
}

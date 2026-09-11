export const OPERATIONAL_SLOT_COUNT = 1;
export const OPERATIONAL_PROGRESS_MILLI_PER_HOUR = 1_000;
export const DEPLOYMENT_AUTOMATION_COURSE_ID = "deployment-automation";
export const SHARED_CONNECTION_TASK_ID = "configure-shared-connection";

export const INSTALLABLE_SERVICE_IDS = ["application-runtime", "relational-database"] as const;

export type InstallableServiceId = (typeof INSTALLABLE_SERVICE_IDS)[number];

export const FIRST_PROJECT_SETUP_TASKS = [
	{ id: "install-application-runtime", durationHours: 2 },
	{ id: "install-relational-database", durationHours: 2 },
	{ id: SHARED_CONNECTION_TASK_ID, durationHours: 1 },
] as const;

export type FirstProjectSetupTaskId = (typeof FIRST_PROJECT_SETUP_TASKS)[number]["id"];

export function firstProjectSetupTaskIds(): readonly FirstProjectSetupTaskId[] {
	return FIRST_PROJECT_SETUP_TASKS.map((task) => task.id);
}

export function firstProjectSetupHours(): number {
	return FIRST_PROJECT_SETUP_TASKS.reduce((sum, task) => sum + task.durationHours, 0);
}

export function installTaskId(serviceId: InstallableServiceId): FirstProjectSetupTaskId {
	return `install-${serviceId}`;
}

export function parseInstallableServiceId(serviceId: string): InstallableServiceId {
	if (serviceId === "application-runtime" || serviceId === "relational-database") {
		return serviceId;
	}

	throw new Error(`unknown installable service: ${serviceId}`);
}

export function setupTaskDurationHours(taskId: string): number {
	const task = FIRST_PROJECT_SETUP_TASKS.find((entry) => entry.id === taskId);

	if (task === undefined) {
		throw new Error(`unknown setup task: ${taskId}`);
	}

	return task.durationHours;
}

export function setupTaskPrerequisites(taskId: string): readonly FirstProjectSetupTaskId[] {
	if (taskId === SHARED_CONNECTION_TASK_ID) {
		return ["install-application-runtime", "install-relational-database"];
	}

	setupTaskDurationHours(taskId);

	return [];
}

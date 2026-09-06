import { units } from "@packages/utils/units";

export type ProjectStatus = "offered" | "declined" | "served";

export interface ProjectInitial {
	id: string;
	estimatedRequestsPerHour: number;
	status: ProjectStatus;
}

export class Project {
	readonly id: string;
	readonly estimatedRequestsPerHour: number;
	readonly #status: ProjectStatus;

	constructor(initial: ProjectInitial) {
		this.id = initial.id;
		this.estimatedRequestsPerHour = units.asNonNegativeInteger(
			initial.estimatedRequestsPerHour,
			"estimatedRequestsPerHour",
		);
		this.#status = initial.status;
	}

	get status(): ProjectStatus {
		return this.#status;
	}

	tick(): number {
		if (this.#status !== "served") {
			return 0;
		}

		return this.estimatedRequestsPerHour;
	}
}

import { Project, type ProjectInitial } from "./project";

export interface CustomerInitial {
	id: string;
	projects: readonly ProjectInitial[];
}

export class Customer {
	readonly id: string;
	readonly projects: readonly Project[];

	constructor(initial: CustomerInitial) {
		this.id = initial.id;
		this.projects = initial.projects.map((project) => new Project(project));
	}
}

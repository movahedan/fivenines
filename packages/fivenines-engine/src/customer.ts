import { Project, type ProjectInitial } from "./project";

export interface CustomerInitial {
	id: string;
	projects: readonly ProjectInitial[];
}

export class Customer {
	readonly id: string;
	readonly projects: readonly Project[];

	constructor(initial: CustomerInitial, liveProjects?: readonly Project[]) {
		this.id = initial.id;
		this.projects = liveProjects ?? initial.projects.map((project) => new Project(project));
	}
}

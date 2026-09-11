import { units } from "@packages/shared/units";

import { DEFAULT_CUSTOMER_TRUST, DEFAULT_HATRED } from "./catalog/contract-policy";
import { Project, type ProjectInitial } from "./project";

export interface CustomerInitial {
	id: string;
	projects: readonly ProjectInitial[];
	trust?: number;
	hatred?: number;
}

function parseScore(value: number, label: string): number {
	const score = units.asFiniteInteger(value, label);

	if (score < 0 || score > 100) {
		throw new Error(`${label} must be 0-100`);
	}

	return score;
}

export class Customer {
	readonly id: string;
	readonly trust: number;
	readonly hatred: number;
	readonly projects: readonly Project[];

	constructor(initial: CustomerInitial, liveProjects?: readonly Project[]) {
		this.id = initial.id;
		this.trust = parseScore(initial.trust ?? DEFAULT_CUSTOMER_TRUST, "trust");
		this.hatred = parseScore(initial.hatred ?? DEFAULT_HATRED, "hatred");
		this.projects = liveProjects ?? initial.projects.map((project) => new Project(project));
	}
}

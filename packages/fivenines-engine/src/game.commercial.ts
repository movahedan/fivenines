import type { Project } from "./project";

export function accrueServedPayg(projects: readonly Project[]): number {
	let paygCents = 0;

	for (const project of projects) {
		paygCents += project.accrueServedPayg();
	}

	return paygCents;
}

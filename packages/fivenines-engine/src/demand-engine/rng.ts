import type { RandomSource } from "../traffic/random-source";

export class SeededRandomSource implements RandomSource {
	#state: number;

	constructor(seed: number) {
		this.#state = seed >>> 0;
	}

	nextUnit(): number {
		this.#state = (this.#state + 0x6d2b79f5) >>> 0;
		let t = this.#state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}
}

export function seedFromProjectId(projectId: string): number {
	let hash = 2166136261;

	for (let index = 0; index < projectId.length; index += 1) {
		hash ^= projectId.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return hash >>> 0;
}

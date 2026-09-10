import type { ReleaseMarker } from "../baseline/types";

export interface RuntimeTechnology {
	id: string;
	name: string;
	prerequisiteIds: readonly string[];
	release: ReleaseMarker;
}

import type { ReleaseMarker } from "../baseline/types";

export interface RuntimeDemandType {
	id: string;
	policy: string;
	release: ReleaseMarker;
}

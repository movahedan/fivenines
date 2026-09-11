export type ReleaseMarker = "v1" | "expansion";

export interface BaselineTechnology {
	id: string;
	name: string;
	prerequisites: readonly string[];
	release: ReleaseMarker;
}

export interface BaselineHardware {
	id: string;
}

export interface BaselineDemandType {
	id: string;
	policy: string;
	release: ReleaseMarker;
}

export interface BaselineProject {
	id: string;
	mix: Readonly<Record<string, number>>;
	technologies: readonly string[];
	rhythm: string;
	variation: string;
	release: ReleaseMarker;
}

export interface BaselineCourse {
	id: string;
	name: string;
	effect: string;
}

export interface BaselineFiniteJob {
	demand: string;
	release: ReleaseMarker;
}

export interface BaselinePolicies {
	time: { internalSubticks: number };
	queue: { automaticRetries: number };
	operations: { powerOnHours: number; duplicatePreparationSkill: string };
	learning: { sharedConcurrentSlots: number };
	economy: { salvageFraction: number };
	observation: { alertOnMonitoringOutage: boolean; backfillMonitoringGaps: boolean };
	release: { expansionEnabled: boolean; default: string };
	demand: {
		rhythms: Readonly<Record<string, unknown>>;
		variation: Readonly<Record<string, unknown>>;
	};
	contract: { finiteJobs: readonly BaselineFiniteJob[] };
}

export interface BaselineDocument {
	policies: BaselinePolicies;
	technologies: readonly BaselineTechnology[];
	hardware: readonly BaselineHardware[];
	demandTypes: readonly BaselineDemandType[];
	projects: readonly BaselineProject[];
	courses: readonly BaselineCourse[];
}

export interface BaselineIssue {
	code: string;
	path: string;
	message: string;
}

export interface BaselineReleaseCounts {
	technologiesV1: number;
	technologiesExpansion: number;
	demandTypesV1: number;
	demandTypesExpansion: number;
	projectsV1: number;
	projectsExpansion: number;
	finiteJobsV1: number;
	finiteJobsExpansion: number;
}

export interface BaselineValidationResult {
	ok: boolean;
	issues: readonly BaselineIssue[];
	counts: BaselineReleaseCounts;
}

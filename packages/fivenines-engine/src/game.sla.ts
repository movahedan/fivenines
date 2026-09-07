import type { Project } from "./project";
import type { ProjectSlaHour } from "./project.metrics";
import type { Server } from "./server";

export type { ProjectSlaHour } from "./project.metrics";

export function applyProjectSla(projects: readonly Project[], servers: readonly Server[]): void {
	const hours = attributeSlaHours(projects, servers);

	for (const project of projects) {
		const hour = hours.get(project.id);

		if (hour === undefined) {
			continue;
		}

		project.recordSlaHour(hour);
	}
}

export function attributeSlaHours(
	projects: readonly Project[],
	servers: readonly Server[],
): ReadonlyMap<string, ProjectSlaHour> {
	const assignedByProject = assignedRequestsByProject(servers);
	const dropByProject = attributeCapacityDrops(servers);
	const hours = new Map<string, ProjectSlaHour>();

	for (const project of projects) {
		const emittedRequests = project.metrics.emittedRequests;
		const assignedRequests = assignedByProject.get(project.id) ?? 0;
		const unroutableRequests = emittedRequests - assignedRequests;
		const capacityDropRequests = dropByProject.get(project.id) ?? 0;
		const handledRequests = assignedRequests - capacityDropRequests;

		hours.set(project.id, {
			emittedRequests,
			assignedRequests,
			unroutableRequests,
			capacityDropRequests,
			handledRequests,
		});
	}

	return hours;
}

function assignedRequestsByProject(servers: readonly Server[]): Map<string, number> {
	const assignedByProject = new Map<string, number>();

	for (const server of servers) {
		for (const slice of server.slices) {
			assignedByProject.set(
				slice.projectId,
				(assignedByProject.get(slice.projectId) ?? 0) + slice.requests,
			);
		}
	}

	return assignedByProject;
}

function attributeCapacityDrops(servers: readonly Server[]): Map<string, number> {
	const totals = new Map<string, number>();

	for (const server of servers) {
		const dropped = server.metrics.droppedRequests;

		if (dropped === 0) {
			continue;
		}

		const order: string[] = [];
		const weightsByProject = new Map<string, number>();

		for (const slice of server.slices) {
			const current = weightsByProject.get(slice.projectId);

			if (current === undefined) {
				order.push(slice.projectId);
				weightsByProject.set(slice.projectId, slice.requests);
			} else {
				weightsByProject.set(slice.projectId, current + slice.requests);
			}
		}

		const shares = splitByWeight(
			dropped,
			order.map((projectId) => weightsByProject.get(projectId) ?? 0),
		);

		for (const [index, projectId] of order.entries()) {
			totals.set(projectId, (totals.get(projectId) ?? 0) + (shares[index] ?? 0));
		}
	}

	return totals;
}

function splitByWeight(total: number, weights: readonly number[]): number[] {
	const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

	if (weights.length === 0 || weightSum === 0) {
		return weights.map(() => 0);
	}

	const shares = weights.map((weight) => Math.floor((total * weight) / weightSum));
	let assigned = shares.reduce((sum, share) => sum + share, 0);

	for (let index = 0; assigned < total && index < shares.length; index += 1) {
		const current = shares[index];

		if (current === undefined) {
			continue;
		}

		shares[index] = current + 1;
		assigned += 1;
	}

	return shares;
}

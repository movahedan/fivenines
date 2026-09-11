import { DEMAND_TYPES, type DemandTypeId, type DemandWaitPolicy } from "../catalog/demand-types";
import { isDurableWaitPolicy, maxCarryTicks } from "../catalog/queue-policy";
import type { DemandBatch } from "./engine";

export interface QueueCohort {
	readonly demandTypeId: DemandTypeId;
	readonly waitPolicy: DemandWaitPolicy;
	readonly arrivalHour: number;
	readonly remainingCount: number;
	readonly completedCount: number;
	readonly durable: boolean;
}

export interface ExecutionInput {
	readonly cohorts: readonly QueueCohort[];
	readonly queuedMemoryKiB: number;
	readonly durableMemoryMicroMiB: number;
}

export interface AdmitResult {
	readonly admitted: readonly QueueCohort[];
	readonly rejectedCount: number;
}

function cohortKey(demandTypeId: DemandTypeId, arrivalHour: number): string {
	return `${demandTypeId}@${String(arrivalHour)}`;
}

function occupancyKiB(demandTypeId: DemandTypeId, count: number): number {
	return DEMAND_TYPES[demandTypeId].queueKiB * count;
}

export class WorkQueue {
	readonly #capacityKiB: number;
	#cohorts = new Map<string, QueueCohort>();

	constructor(capacityKiB: number) {
		if (!Number.isInteger(capacityKiB) || capacityKiB < 0) {
			throw new Error(`queue capacityKiB must be a non-negative integer: ${String(capacityKiB)}`);
		}

		this.#capacityKiB = capacityKiB;
	}

	get occupancyKiB(): number {
		let total = 0;

		for (const cohort of this.#cohorts.values()) {
			total += occupancyKiB(cohort.demandTypeId, cohort.remainingCount);
		}

		return total;
	}

	get durableMemoryMicroMiB(): number {
		let total = 0;

		for (const cohort of this.#cohorts.values()) {
			if (!cohort.durable) {
				continue;
			}

			total += DEMAND_TYPES[cohort.demandTypeId].workingMemoryMicroMiB * cohort.remainingCount;
		}

		return total;
	}

	cohorts(): readonly QueueCohort[] {
		return [...this.#cohorts.values()];
	}

	admit(hourIndex: number, batches: readonly DemandBatch[]): AdmitResult {
		const admitted: QueueCohort[] = [];
		let rejectedCount = 0;

		for (const batch of batches) {
			const needed = occupancyKiB(batch.demandTypeId, batch.count);
			const free = this.#capacityKiB - this.occupancyKiB;

			if (needed > free) {
				rejectedCount += batch.count;
				continue;
			}

			const key = cohortKey(batch.demandTypeId, hourIndex);
			const existing = this.#cohorts.get(key);

			if (existing !== undefined) {
				const next: QueueCohort = {
					...existing,
					remainingCount: existing.remainingCount + batch.count,
				};
				this.#cohorts.set(key, next);
				admitted.push(next);
				continue;
			}

			const cohort: QueueCohort = {
				demandTypeId: batch.demandTypeId,
				waitPolicy: batch.waitPolicy,
				arrivalHour: hourIndex,
				remainingCount: batch.count,
				completedCount: 0,
				durable: isDurableWaitPolicy(batch.waitPolicy),
			};
			this.#cohorts.set(key, cohort);
			admitted.push(cohort);
		}

		return { admitted, rejectedCount };
	}

	advance(
		hourIndex: number,
		demandTypeId: DemandTypeId,
		arrivalHour: number,
		completed: number,
	): void {
		const key = cohortKey(demandTypeId, arrivalHour);
		const cohort = this.#cohorts.get(key);

		if (cohort === undefined) {
			throw new Error(`unknown cohort: ${key}`);
		}

		if (!Number.isInteger(completed) || completed < 0 || completed > cohort.remainingCount) {
			throw new Error(`invalid completed count: ${String(completed)}`);
		}

		const remainingCount = cohort.remainingCount - completed;
		const next: QueueCohort = {
			...cohort,
			remainingCount,
			completedCount: cohort.completedCount + completed,
		};

		if (remainingCount === 0 && maxCarryTicks(cohort.waitPolicy) !== null) {
			this.#cohorts.delete(key);
			return;
		}

		this.#cohorts.set(key, next);
		this.#expireIfNeeded(hourIndex, key, next);
	}

	expire(hourIndex: number): readonly QueueCohort[] {
		const expired: QueueCohort[] = [];

		for (const [key, cohort] of this.#cohorts) {
			if (this.#isExpired(hourIndex, cohort)) {
				expired.push(cohort);
				this.#cohorts.delete(key);
			}
		}

		return expired;
	}

	toExecutionInput(): ExecutionInput {
		return {
			cohorts: this.cohorts(),
			queuedMemoryKiB: this.occupancyKiB,
			durableMemoryMicroMiB: this.durableMemoryMicroMiB,
		};
	}

	#isExpired(hourIndex: number, cohort: QueueCohort): boolean {
		const carry = maxCarryTicks(cohort.waitPolicy);

		if (carry === null) {
			return false;
		}

		return hourIndex - cohort.arrivalHour > carry;
	}

	#expireIfNeeded(hourIndex: number, key: string, cohort: QueueCohort): void {
		if (this.#isExpired(hourIndex, cohort)) {
			this.#cohorts.delete(key);
		}
	}
}

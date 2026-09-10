import type { MixShare } from "../catalog/demand-projects";
import type { DemandTypeId } from "../catalog/demand-types";
import type { RandomSource } from "../traffic/random-source";
import { sampleBinomial } from "./sample";

export function splitLargestRemainder(
	total: number,
	mix: readonly MixShare[],
): Readonly<Record<DemandTypeId, number>> {
	const counts = {} as Record<DemandTypeId, number>;
	let assigned = 0;
	const remainders: { demandTypeId: DemandTypeId; remainder: number }[] = [];

	for (const share of mix) {
		const exact = (total * share.permille) / 1000;
		const whole = Math.floor(exact);
		counts[share.demandTypeId] = whole;
		assigned += whole;
		remainders.push({ demandTypeId: share.demandTypeId, remainder: exact - whole });
	}

	remainders.sort((left, right) => right.remainder - left.remainder);

	let leftover = total - assigned;

	for (const entry of remainders) {
		if (leftover === 0) {
			break;
		}

		counts[entry.demandTypeId] += 1;
		leftover -= 1;
	}

	return counts;
}

export function splitMultinomial(
	total: number,
	mix: readonly MixShare[],
	random: RandomSource,
): Readonly<Record<DemandTypeId, number>> {
	const counts = {} as Record<DemandTypeId, number>;
	let remaining = total;
	let remainingPermille = 1000;

	for (let index = 0; index < mix.length; index += 1) {
		const share = mix[index];

		if (share === undefined) {
			continue;
		}

		if (index === mix.length - 1) {
			counts[share.demandTypeId] = remaining;
			break;
		}

		const drawn = sampleBinomial(remaining, share.permille / remainingPermille, random);
		counts[share.demandTypeId] = drawn;
		remaining -= drawn;
		remainingPermille -= share.permille;
	}

	return counts;
}

import type { RandomSource } from "../traffic/random-source";

function sampleStandardNormal(random: RandomSource): number {
	const u1 = Math.max(random.nextUnit(), Number.EPSILON);
	const u2 = random.nextUnit();

	return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleGammaMeanOne(shape: number, random: RandomSource): number {
	if (shape < 1) {
		throw new Error(`gamma shape must be >= 1: ${String(shape)}`);
	}

	const d = shape - 1 / 3;
	const c = 1 / Math.sqrt(9 * d);

	for (;;) {
		let x = sampleStandardNormal(random);
		let v = 1 + c * x;

		while (v <= 0) {
			x = sampleStandardNormal(random);
			v = 1 + c * x;
		}

		v = v * v * v;
		const u = random.nextUnit();

		if (u < 1 - 0.0331 * x * x * x * x) {
			return (d * v) / shape;
		}

		if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
			return (d * v) / shape;
		}
	}
}

export function samplePoisson(lambda: number, random: RandomSource): number {
	if (!(lambda >= 0) || !Number.isFinite(lambda)) {
		throw new Error(`poisson lambda must be finite and >= 0: ${String(lambda)}`);
	}

	if (lambda === 0) {
		return 0;
	}

	if (lambda > 50) {
		const z = sampleStandardNormal(random);

		return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
	}

	const limit = Math.exp(-lambda);
	let count = 0;
	let product = 1;

	do {
		count += 1;
		product *= random.nextUnit();
	} while (product > limit);

	return count - 1;
}

export function sampleBinomial(trials: number, probability: number, random: RandomSource): number {
	if (!Number.isInteger(trials) || trials < 0) {
		throw new Error(`binomial trials must be a non-negative integer: ${String(trials)}`);
	}

	if (!(probability >= 0) || probability > 1) {
		throw new Error(`binomial probability out of range: ${String(probability)}`);
	}

	if (trials === 0 || probability === 0) {
		return 0;
	}

	if (probability === 1) {
		return trials;
	}

	let successes = 0;

	for (let index = 0; index < trials; index += 1) {
		if (random.nextUnit() < probability) {
			successes += 1;
		}
	}

	return successes;
}

export function sampleGammaPoisson(mean: number, gammaShape: number, random: RandomSource): number {
	if (mean === 0) {
		return 0;
	}

	const mixed = mean * sampleGammaMeanOne(gammaShape, random);

	return samplePoisson(mixed, random);
}

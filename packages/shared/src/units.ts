function asFiniteInteger(value: number, label: string): number {
	if (!Number.isFinite(value) || !Number.isInteger(value)) {
		throw new Error(`${label} must be a finite integer`);
	}

	return value;
}

function asNonNegativeInteger(value: number, label: string): number {
	const integer = asFiniteInteger(value, label);

	if (integer < 0) {
		throw new Error(`${label} must be a non-negative integer`);
	}

	return integer;
}

function ratioPercent(numerator: number, denominator: number): number {
	asNonNegativeInteger(numerator, "numerator");
	asNonNegativeInteger(denominator, "denominator");

	if (denominator === 0) {
		return 0;
	}

	return Math.floor((numerator * 100) / denominator);
}

function partsPerMillion(numerator: number, denominator: number): number {
	asNonNegativeInteger(numerator, "numerator");
	asNonNegativeInteger(denominator, "denominator");

	if (denominator === 0) {
		return 0;
	}

	return Math.floor((numerator * 1_000_000) / denominator);
}

export const units = {
	asFiniteInteger,
	asNonNegativeInteger,
	ratioPercent,
	partsPerMillion,
};

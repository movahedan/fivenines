export interface RandomSource {
	nextUnit(): number;
}

export class MathRandomSource implements RandomSource {
	nextUnit(): number {
		return Math.random();
	}
}

export class SequenceRandomSource implements RandomSource {
	#index = 0;

	constructor(private readonly values: readonly number[]) {}

	nextUnit(): number {
		const value = this.values[this.#index];

		if (value === undefined) {
			throw new Error("random sequence exhausted");
		}

		this.#index += 1;

		return value;
	}
}

export class FixedRandomSource implements RandomSource {
	constructor(private readonly value: number) {}

	nextUnit(): number {
		return this.value;
	}
}

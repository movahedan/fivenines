function assertUnique(values: readonly string[], label: string): void {
	const seen = new Set<string>();

	for (const value of values) {
		if (seen.has(value)) {
			throw new Error(`duplicate ${label} id: ${value}`);
		}

		seen.add(value);
	}
}

export const ids = {
	assertUnique,
};

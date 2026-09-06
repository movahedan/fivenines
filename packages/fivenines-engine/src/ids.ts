export function assertUniqueIds(ids: readonly string[], label: string): void {
	const seen = new Set<string>();

	for (const id of ids) {
		if (seen.has(id)) {
			throw new Error(`duplicate ${label} id: ${id}`);
		}

		seen.add(id);
	}
}

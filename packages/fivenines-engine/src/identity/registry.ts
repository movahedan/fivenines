export const IDENTITY_KINDS = ["customer", "project", "asset", "service", "instance"] as const;

export type IdentityKind = (typeof IDENTITY_KINDS)[number];

export interface IdentityRecord {
	kind: IdentityKind;
	id: string;
	ownerId: string | null;
}

interface RegistrySnapshot {
	byKey: Map<string, IdentityRecord>;
	byId: Map<string, IdentityRecord>;
	byOwner: Map<string, IdentityRecord[]>;
}

export class IdentityRegistry {
	#byKey = new Map<string, IdentityRecord>();
	#byId = new Map<string, IdentityRecord>();
	#byOwner = new Map<string, IdentityRecord[]>();

	register(record: IdentityRecord): void {
		this.registerAll([record]);
	}

	registerAll(records: readonly IdentityRecord[]): void {
		const snapshot = this.#snapshot();

		try {
			for (const record of records) {
				this.#registerOne(record);
			}
		} catch (error) {
			this.#restore(snapshot);
			throw error;
		}
	}

	get(kind: IdentityKind, id: string): IdentityRecord {
		const record = this.#byKey.get(recordKey(kind, id));

		if (record === undefined) {
			throw new Error(`unknown ${kind} id: ${id}`);
		}

		return record;
	}

	ownedBy(ownerId: string): readonly IdentityRecord[] {
		const owned = this.#byOwner.get(ownerId);

		return owned === undefined ? [] : [...owned];
	}

	clone(): IdentityRegistry {
		const copy = new IdentityRegistry();
		copy.#restore(this.#snapshot());
		return copy;
	}

	#registerOne(record: IdentityRecord): void {
		if (record.id.length === 0) {
			throw new Error(`empty ${record.kind} id`);
		}

		if (record.kind === "customer" && record.ownerId !== null && record.ownerId !== "game") {
			throw new Error(`customer owner must be null or game: ${record.id}`);
		}

		const existingId = this.#byId.get(record.id);

		if (existingId !== undefined) {
			throw new Error(`duplicate id: ${record.id}`);
		}

		const key = recordKey(record.kind, record.id);

		if (this.#byKey.has(key)) {
			throw new Error(`duplicate ${record.kind} id: ${record.id}`);
		}

		this.#byId.set(record.id, record);
		this.#byKey.set(key, record);

		if (record.ownerId !== null) {
			const owned = this.#byOwner.get(record.ownerId);

			if (owned === undefined) {
				this.#byOwner.set(record.ownerId, [record]);
			} else {
				owned.push(record);
			}
		}
	}

	#snapshot(): RegistrySnapshot {
		return {
			byKey: new Map(this.#byKey),
			byId: new Map(this.#byId),
			byOwner: new Map(
				[...this.#byOwner.entries()].map(([ownerId, records]) => [ownerId, [...records]]),
			),
		};
	}

	#restore(snapshot: RegistrySnapshot): void {
		this.#byKey = snapshot.byKey;
		this.#byId = snapshot.byId;
		this.#byOwner = snapshot.byOwner;
	}
}

function recordKey(kind: IdentityKind, id: string): string {
	return `${kind}:${id}`;
}

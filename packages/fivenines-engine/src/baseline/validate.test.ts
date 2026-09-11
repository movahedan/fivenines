import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BASELINE_JSON_PATH, loadBaselineDocument } from "./load";
import type { BaselineDocument } from "./types";
import { EXPECTED_RELEASE_COUNTS, validateBaseline } from "./validate";

describe("baseline - load", () => {
	it("throws when the authored catalog file is absent", () => {
		expect(() => loadBaselineDocument("/tmp/fivenines-missing-baseline.json")).toThrow(
			"baseline catalog missing",
		);
	});

	it("loads the product baseline from the repository docs tree", () => {
		expect(BASELINE_JSON_PATH.endsWith("docs/product/balance/baseline.json")).toBe(true);
		expect(loadBaselineDocument().technologies.length).toBeGreaterThan(0);
	});
});

describe("baseline - validate", () => {
	it("accepts the authored design-0.3 catalog", () => {
		const result = validateBaseline(loadBaselineDocument());

		expect(result.ok).toBe(true);
		expect(result.issues).toEqual([]);
		expect(result.counts).toEqual(EXPECTED_RELEASE_COUNTS);
	});

	it("rejects a duplicate technology id", () => {
		const document = mutate((next) => {
			const first = next.technologies[0];

			if (first === undefined) {
				throw new Error("expected a technology");
			}

			next.technologies.push({ ...first });
		});

		expect(codes(validateBaseline(document))).toContain("duplicate-id");
	});

	it("rejects a missing technology prerequisite", () => {
		const document = mutate((next) => {
			const first = next.technologies[0];

			if (first === undefined) {
				throw new Error("expected a technology");
			}

			first.prerequisites = ["Not A Real Technology"];
		});

		expect(codes(validateBaseline(document))).toContain("missing-prereq");
	});

	it("rejects a cyclic technology DAG", () => {
		const document = mutate((next) => {
			const left = next.technologies[0];
			const right = next.technologies[1];

			if (left === undefined || right === undefined) {
				throw new Error("expected two technologies");
			}

			left.prerequisites = [right.name];
			right.prerequisites = [left.name];
		});

		expect(codes(validateBaseline(document))).toContain("cycle");
	});

	it("rejects a version-one technology that requires an expansion node", () => {
		const document = mutate((next) => {
			const expansion = next.technologies.find((row) => row.release === "expansion");
			const base = next.technologies.find((row) => row.release === "v1");

			if (expansion === undefined || base === undefined) {
				throw new Error("expected v1 and expansion technologies");
			}

			base.prerequisites = [expansion.name];
		});

		expect(codes(validateBaseline(document))).toContain("v1-depends-expansion");
	});

	it("rejects a project mix that does not sum to one", () => {
		const document = mutate((next) => {
			const project = next.projects[0];

			if (project === undefined) {
				throw new Error("expected a project");
			}

			project.mix = { "page-read": 0.5 };
		});

		expect(codes(validateBaseline(document))).toContain("mix-sum");
	});

	it("rejects a policy guard when internal subticks are enabled", () => {
		const document = mutate((next) => {
			next.policies.time.internalSubticks = 1;
		});

		expect(codes(validateBaseline(document))).toContain("policy-guard");
	});

	it("keeps Game.tick free of baseline imports", () => {
		const gamePath = resolve(dirname(fileURLToPath(import.meta.url)), "../game.ts");
		const source = readFileSync(gamePath, "utf8");

		expect(source.includes("baseline/")).toBe(false);
	});
});

function mutate(edit: (document: MutableBaseline) => void): BaselineDocument {
	const document = structuredClone(loadBaselineDocument()) as MutableBaseline;

	edit(document);

	return document;
}

function codes(result: { issues: readonly { code: string }[] }): readonly string[] {
	return result.issues.map((issue) => issue.code);
}

type MutableBaseline = {
	-readonly [K in keyof BaselineDocument]: BaselineDocument[K] extends readonly (infer T)[]
		? T[]
		: BaselineDocument[K];
} & {
	policies: BaselineDocument["policies"];
	technologies: Array<BaselineDocument["technologies"][number] & { prerequisites: string[] }>;
	projects: Array<BaselineDocument["projects"][number] & { mix: Record<string, number> }>;
};

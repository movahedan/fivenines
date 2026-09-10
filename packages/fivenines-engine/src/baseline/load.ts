import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { BaselineDocument } from "./types";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

export const BASELINE_JSON_PATH = resolve(REPO_ROOT, "docs/product/balance/baseline.json");

export function loadBaselineDocument(path: string = BASELINE_JSON_PATH): BaselineDocument {
	if (!existsSync(path)) {
		throw new Error(`baseline catalog missing: ${path}`);
	}

	const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

	return asBaselineDocument(parsed);
}

function asBaselineDocument(value: unknown): BaselineDocument {
	if (!isRecord(value)) {
		throw new Error("baseline catalog is not an object");
	}

	return value as unknown as BaselineDocument;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

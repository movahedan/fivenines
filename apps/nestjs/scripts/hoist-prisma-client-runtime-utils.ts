import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGE_NAME = "@prisma/client-runtime-utils";

function packageNameAt(dir: string): string | undefined {
	const pkgPath = join(dir, "package.json");
	if (!existsSync(pkgPath)) {
		return undefined;
	}

	try {
		const parsed: unknown = JSON.parse(readFileSync(pkgPath, "utf8"));
		if (typeof parsed !== "object" || parsed === null || !("name" in parsed)) {
			return undefined;
		}
		const name = parsed.name;
		return typeof name === "string" ? name : undefined;
	} catch {
		return undefined;
	}
}

function bunStoreCandidates(repoRoot: string): readonly string[] {
	const bunRoot = join(repoRoot, "node_modules/.bun");
	if (!existsSync(bunRoot)) {
		return [];
	}

	let entries: string[];
	try {
		entries = readdirSync(bunRoot);
	} catch {
		return [];
	}

	return entries.map((entry) => join(bunRoot, entry, "node_modules/@prisma/client-runtime-utils"));
}

function candidateDirs(repoRoot: string): readonly string[] {
	return [
		join(repoRoot, "node_modules/@prisma/client-runtime-utils"),
		join(repoRoot, "node_modules/@prisma/client/node_modules/@prisma/client-runtime-utils"),
		join(repoRoot, "apps/nestjs/node_modules/@prisma/client-runtime-utils"),
		join(
			repoRoot,
			"apps/nestjs/node_modules/@prisma/client/node_modules/@prisma/client-runtime-utils",
		),
		...bunStoreCandidates(repoRoot),
	];
}

export function hoistPrismaClientRuntimeUtils(repoRoot: string): void {
	const dest = join(repoRoot, "node_modules/@prisma/client-runtime-utils");
	if (packageNameAt(dest) === PACKAGE_NAME) {
		return;
	}

	const source = candidateDirs(repoRoot).find((dir) => packageNameAt(dir) === PACKAGE_NAME);
	if (source === undefined) {
		throw new Error(`Cannot locate ${PACKAGE_NAME} under node_modules`);
	}

	mkdirSync(join(repoRoot, "node_modules/@prisma"), { recursive: true });
	cpSync(source, dest, { recursive: true });
}

if (import.meta.main) {
	hoistPrismaClientRuntimeUtils(process.cwd());
}

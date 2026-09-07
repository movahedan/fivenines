import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { type PackageExportValue, toSourceExport } from "./source-export";

async function addNestedSameNameExports(
	parentExportName: string,
	parentAbs: string,
	packageDir: string,
	newExports: Record<string, PackageExportValue>,
): Promise<void> {
	const entries = await readdir(parentAbs, { withFileTypes: true });

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}

		const tsxFile = path.join(parentAbs, entry.name, `${entry.name}.tsx`);
		const tsFile = path.join(parentAbs, entry.name, `${entry.name}.ts`);
		const nestedKey = `./${parentExportName}/${entry.name}`;

		if (await Bun.file(tsxFile).exists()) {
			newExports[nestedKey] = toSourceExport(`./${path.relative(packageDir, tsxFile)}`);
			continue;
		}

		if (await Bun.file(tsFile).exists()) {
			newExports[nestedKey] = toSourceExport(`./${path.relative(packageDir, tsFile)}`);
		}
	}
}

export async function buildExportsWithoutPattern(
	files: readonly Dirent[],
	srcDir: string,
	packageDir: string,
): Promise<Record<string, PackageExportValue>> {
	const newExports: Record<string, PackageExportValue> = {};

	for (const file of files) {
		if (file.isDirectory()) {
			const dirAbs = path.join(srcDir, file.name);
			const indexFile = path.join(dirAbs, "index.ts");
			const indexTsxFile = path.join(dirAbs, "index.tsx");
			const sameNameFile = path.join(dirAbs, `${file.name}.ts`);
			const sameNameTsxFile = path.join(dirAbs, `${file.name}.tsx`);

			if (await Bun.file(indexFile).exists()) {
				newExports[`./${file.name}`] = toSourceExport(`./${path.relative(packageDir, indexFile)}`);
				await addNestedSameNameExports(file.name, dirAbs, packageDir, newExports);
			} else if (await Bun.file(indexTsxFile).exists()) {
				newExports[`./${file.name}`] = toSourceExport(
					`./${path.relative(packageDir, indexTsxFile)}`,
				);
				await addNestedSameNameExports(file.name, dirAbs, packageDir, newExports);
			} else if (await Bun.file(sameNameFile).exists()) {
				newExports[`./${file.name}`] = toSourceExport(
					`./${path.relative(packageDir, sameNameFile)}`,
				);
			} else if (await Bun.file(sameNameTsxFile).exists()) {
				newExports[`./${file.name}`] = toSourceExport(
					`./${path.relative(packageDir, sameNameTsxFile)}`,
				);
			}

			continue;
		}

		const shouldSkip = !file.name.endsWith(".ts") && !file.name.endsWith(".tsx");
		if (shouldSkip) continue;
		if (/\.(?:test|spec)\.[cm]?tsx?$/u.test(file.name)) continue;

		if (file.name === "index.ts") {
			newExports["."] = toSourceExport(
				`./${path.relative(packageDir, path.join(srcDir, file.name))}`,
			);
			continue;
		}

		const mainFile = path.join(srcDir, file.name);
		const relativePath = `./${path.relative(packageDir, mainFile)}`;

		if (await Bun.file(mainFile).exists()) {
			newExports[`./${file.name}`] = toSourceExport(relativePath);
		}
	}

	return newExports;
}

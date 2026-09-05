import { afterEach, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { hoistPrismaClientRuntimeUtils } from "./hoist-prisma-client-runtime-utils";

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("hoistPrismaClientRuntimeUtils", () => {
	it("copies the package next to node_modules/.prisma when only nested under @prisma/client", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "hoist-prisma-runtime-"));
		tempDirs.push(root);

		const nested = path.join(
			root,
			"node_modules/@prisma/client/node_modules/@prisma/client-runtime-utils",
		);
		await mkdir(nested, { recursive: true });
		await writeFile(
			path.join(nested, "package.json"),
			JSON.stringify({ name: "@prisma/client-runtime-utils", version: "7.1.0" }),
		);
		await writeFile(path.join(nested, "index.js"), "export {}\n");

		hoistPrismaClientRuntimeUtils(root);

		const destPkg = path.join(root, "node_modules/@prisma/client-runtime-utils/package.json");
		const parsed: unknown = JSON.parse(await readFile(destPkg, "utf8"));
		expect(parsed).toEqual({ name: "@prisma/client-runtime-utils", version: "7.1.0" });
	});

	it("no-ops when the package is already hoisted", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "hoist-prisma-runtime-"));
		tempDirs.push(root);

		const dest = path.join(root, "node_modules/@prisma/client-runtime-utils");
		await mkdir(dest, { recursive: true });
		await writeFile(
			path.join(dest, "package.json"),
			JSON.stringify({ name: "@prisma/client-runtime-utils", version: "7.1.0" }),
		);

		hoistPrismaClientRuntimeUtils(root);
	});
});

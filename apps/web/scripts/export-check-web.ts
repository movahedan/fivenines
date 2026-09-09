/**
 * Assert prerendered HTML artifacts exist and include basic SEO tags.
 * Usage: cd apps/web && bun scripts/export-check-web.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { prerenderPathToDistRelative, WEB_PRERENDER_PATHS } from "./web-prerender-paths";

const distDir = join(fileURLToPath(new URL(".", import.meta.url)), "../dist/client");

function fail(message: string): never {
	console.error(`export:check failed: ${message}`);
	process.exit(1);
}

function readDistHtml(relativePath: string): string {
	const filePath = join(distDir, relativePath);
	if (!existsSync(filePath)) {
		fail(`missing file dist/client/${relativePath}`);
	}
	return readFileSync(filePath, "utf8");
}

for (const path of WEB_PRERENDER_PATHS) {
	const relative = prerenderPathToDistRelative(path);
	const html = readDistHtml(relative);
	if (!html.includes("<title>")) {
		fail(`${path} missing <title>`);
	}
	if (!html.includes('property="og:image"')) {
		fail(`${path} missing property="og:image"`);
	}
}

console.log(`export:check passed (${WEB_PRERENDER_PATHS.length} HTML files with title + og:image)`);

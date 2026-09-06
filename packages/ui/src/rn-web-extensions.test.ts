import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rnWebVite = readFileSync(
	path.join(path.dirname(fileURLToPath(import.meta.url)), "../scripts/rn-web.ts"),
	"utf8",
);

describe("rnWebExtensions - module resolution", () => {
	it("prefers ESM web files over CJS web files", () => {
		const webMjs = rnWebVite.indexOf('".web.mjs"');
		const webJs = rnWebVite.indexOf('".web.js"');
		const mjs = rnWebVite.indexOf('\n	".mjs",');
		const js = rnWebVite.indexOf('\n	".js",');

		expect(webMjs).toBeGreaterThan(-1);
		expect(webJs).toBeGreaterThan(-1);
		expect(webMjs).toBeLessThan(webJs);
		expect(mjs).toBeGreaterThan(-1);
		expect(js).toBeGreaterThan(-1);
		expect(mjs).toBeLessThan(js);
	});
});

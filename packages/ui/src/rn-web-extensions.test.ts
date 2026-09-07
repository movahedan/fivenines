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
		const block = rnWebVite.slice(rnWebVite.indexOf("export const rnWebExtensions"));
		const webMjs = block.indexOf('".web.mjs"');
		const webJs = block.indexOf('".web.js"');
		const mjs = block.indexOf('\n	".mjs",');
		const js = block.indexOf('\n	".js",');

		expect(webMjs).toBeGreaterThan(-1);
		expect(webJs).toBeGreaterThan(-1);
		expect(webMjs).toBeLessThan(webJs);
		expect(mjs).toBeGreaterThan(-1);
		expect(js).toBeGreaterThan(-1);
		expect(mjs).toBeLessThan(js);
	});
});

describe("preferNodeModuleEsm", () => {
	it("skips remapping ESM ids that already end with .mjs", () => {
		expect(rnWebVite.includes('posix.endsWith(".js") && !posix.endsWith(".mjs")')).toBe(true);
	});

	it("is wired into applyRnWebVite before JSX transpile", () => {
		expect(rnWebVite.includes("preferNodeModuleEsmPlugin()")).toBe(true);
		const applyAt = rnWebVite.indexOf("export function applyRnWebVite");
		const pluginAt = rnWebVite.indexOf("preferNodeModuleEsmPlugin()", applyAt);
		const jsxAt = rnWebVite.indexOf("transpileRnPrimitivesJsx()", applyAt);
		expect(pluginAt).toBeGreaterThan(-1);
		expect(jsxAt).toBeGreaterThan(-1);
		expect(pluginAt).toBeLessThan(jsxAt);
	});
});

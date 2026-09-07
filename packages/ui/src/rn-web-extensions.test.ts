import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { rewriteExternalRequires, rnWebAliases } from "../scripts/rn-web";

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

describe("rnWebGlobalDefines - RN globals", () => {
	it("defines __DEV__ for applyRnWebVite and web Vite", () => {
		expect(rnWebVite.includes('__DEV__: JSON.stringify(mode === "development")')).toBe(true);
		expect(rnWebVite.includes('global: "globalThis"')).toBe(true);
		expect(rnWebVite.includes("viteConfig.define = {")).toBe(true);
		expect(rnWebVite.includes("...rnWebGlobalDefines(mode)")).toBe(true);
		expect(rnWebVite.includes('"react-native-reanimated"')).toBe(true);
	});
});

describe("rnWebAliases - reanimated webUtils CJS imports", () => {
	it("points react-native-web dist/cjs StyleSheet helpers at the ESM dist", () => {
		const aliases = rnWebAliases();
		const createStyle =
			aliases["react-native-web/dist/cjs/exports/StyleSheet/compiler/createReactDOMStyle.js"];
		const preprocess = aliases["react-native-web/dist/cjs/exports/StyleSheet/preprocess.js"];

		expect(createStyle?.split("\\").join("/")).toMatch(
			/react-native-web\/dist\/exports\/StyleSheet\/compiler\/createReactDOMStyle\.js$/u,
		);
		expect(preprocess?.split("\\").join("/")).toMatch(
			/react-native-web\/dist\/exports\/StyleSheet\/preprocess\.js$/u,
		);
	});
});

describe("rewriteExternalRequires - CJS default interop", () => {
	it("unwraps default when replacing esbuild __require calls", () => {
		const rewritten = rewriteExternalRequires(
			'const semverSatisfies = __require("semver/functions/satisfies");',
		);

		expect(rewritten).toContain('import * as __ext0 from "semver/functions/satisfies";');
		expect(rewritten).toContain("(__ext0.default ?? __ext0)");
	});
});

describe("stubReanimatedWorkletsVersionCheck", () => {
	it("is wired into applyRnWebVite before CJS transpile", () => {
		expect(rnWebVite.includes("stubReanimatedWorkletsVersionCheck()")).toBe(true);
		const applyAt = rnWebVite.indexOf("export function applyRnWebVite");
		const stubAt = rnWebVite.indexOf("stubReanimatedWorkletsVersionCheck()", applyAt);
		const cjsAt = rnWebVite.indexOf("transpileCjsNodeModules()", applyAt);
		expect(stubAt).toBeGreaterThan(-1);
		expect(cjsAt).toBeGreaterThan(-1);
		expect(stubAt).toBeLessThan(cjsAt);
	});
});

describe("rewriteReanimatedBrowserGlobals", () => {
	it("is wired into applyRnWebVite", () => {
		expect(rnWebVite.includes("rewriteReanimatedBrowserGlobals()")).toBe(true);
	});
});

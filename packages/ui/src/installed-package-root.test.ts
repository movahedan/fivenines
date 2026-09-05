import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

import { installedPackageRoot, reactNativeSvgWebEntry } from "./installed-package-root";

describe("installedPackageRoot - bun layout", () => {
	it("points at the react package that contains production CJS", () => {
		const reactRoot = installedPackageRoot("react");

		expect(existsSync(path.join(reactRoot, "cjs/react.production.js"))).toBe(true);
		expect(existsSync(path.join(reactRoot, "cjs/react-jsx-runtime.production.js"))).toBe(true);
	});

	it("points at react-dom production client CJS", () => {
		const reactDomRoot = installedPackageRoot("react-dom");

		expect(existsSync(path.join(reactDomRoot, "cjs/react-dom-client.production.js"))).toBe(true);
	});
});

describe("reactNativeSvgWebEntry - bun layout", () => {
	it("points at the web bundle that exists on disk", () => {
		const webBundle = reactNativeSvgWebEntry();

		expect(existsSync(webBundle)).toBe(true);
		expect(webBundle.endsWith("ReactNativeSVG.web.js")).toBe(true);
	});
});

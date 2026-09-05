import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromUi = createRequire(path.join(uiRoot, "package.json"));

export function installedPackageRoot(packageName: string): string {
	return path.dirname(requireFromUi.resolve(`${packageName}/package.json`));
}

export function reactNativeSvgWebEntry(): string {
	return path.join(installedPackageRoot("react-native-svg"), "lib/module/ReactNativeSVG.web.js");
}

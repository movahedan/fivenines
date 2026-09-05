import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build as esbuildBuild, transform } from "esbuild";
import type { Plugin, UserConfig } from "vite";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(storybookDir, "..");
const requireFromUi = createRequire(path.join(uiRoot, "package.json"));

function packageDir(specifier: string): string {
	return path.dirname(requireFromUi.resolve(`${specifier}/package.json`));
}

const sharedReactPackages = [
	"react",
	"react-dom",
	"react-dom/client",
	"react/jsx-runtime",
	"react/jsx-dev-runtime",
	"react/compiler-runtime",
] as const;

const reactExportNames = [
	"Activity",
	"Children",
	"Component",
	"Fragment",
	"Profiler",
	"PureComponent",
	"StrictMode",
	"Suspense",
	"__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
	"__COMPILER_RUNTIME",
	"act",
	"cache",
	"cacheSignal",
	"captureOwnerStack",
	"cloneElement",
	"createContext",
	"createElement",
	"createRef",
	"forwardRef",
	"isValidElement",
	"lazy",
	"memo",
	"startTransition",
	"unstable_useCacheRefresh",
	"use",
	"useActionState",
	"useCallback",
	"useContext",
	"useDebugValue",
	"useDeferredValue",
	"useEffect",
	"useEffectEvent",
	"useId",
	"useImperativeHandle",
	"useInsertionEffect",
	"useLayoutEffect",
	"useMemo",
	"useOptimistic",
	"useReducer",
	"useRef",
	"useState",
	"useSyncExternalStore",
	"useTransition",
	"version",
] as const;

const jsxRuntimeExportNames = ["Fragment", "jsx", "jsxs"] as const;
const jsxDevRuntimeExportNames = ["Fragment", "jsxDEV"] as const;

const reactDomExportNames = [
	"__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
	"createPortal",
	"flushSync",
	"preconnect",
	"prefetchDNS",
	"preinit",
	"preinitModule",
	"preload",
	"preloadModule",
	"requestFormReset",
	"unstable_batchedUpdates",
	"useFormState",
	"useFormStatus",
	"version",
] as const;

const reactDomClientExportNames = ["createRoot", "hydrateRoot", "version"] as const;

function reactBuildFlavor(): "development" | "production" {
	return process.env.NODE_ENV === "production" ? "production" : "development";
}

function virtualReactBareId(source: string): (typeof sharedReactPackages)[number] | undefined {
	const withoutQuery = source.split("?")[0] ?? source;
	if (withoutQuery.startsWith("\0")) {
		return;
	}
	if ((sharedReactPackages as readonly string[]).includes(withoutQuery)) {
		return withoutQuery as (typeof sharedReactPackages)[number];
	}

	const posix = withoutQuery.replaceAll("\\", "/");
	if (!posix.includes("/node_modules/")) {
		return;
	}

	const suffixToBare: Array<[string, (typeof sharedReactPackages)[number]]> = [
		["/react/jsx-dev-runtime.js", "react/jsx-dev-runtime"],
		["/react/jsx-runtime.js", "react/jsx-runtime"],
		["/react/compiler-runtime.js", "react/compiler-runtime"],
		["/react/cjs/react-compiler-runtime.development.js", "react/compiler-runtime"],
		["/react/cjs/react-compiler-runtime.production.js", "react/compiler-runtime"],
		["/react/index.js", "react"],
		["/react/cjs/react.development.js", "react"],
		["/react/cjs/react.production.js", "react"],
		["/react-dom/client.js", "react-dom/client"],
		["/react-dom/index.js", "react-dom"],
		["/react-dom/cjs/react-dom-client.development.js", "react-dom/client"],
		["/react-dom/cjs/react-dom-client.production.js", "react-dom/client"],
		["/react-dom/cjs/react-dom.development.js", "react-dom"],
		["/react-dom/cjs/react-dom.production.js", "react-dom"],
	];

	for (const [suffix, bare] of suffixToBare) {
		if (posix.endsWith(suffix)) {
			return bare;
		}
	}
}

function rewriteCjsRequires(bundled: string, externals: string[]): string {
	if (externals.length === 0) {
		return bundled;
	}
	const imports = externals
		.map((specifier, index) => `import __ext${String(index)} from ${JSON.stringify(specifier)};`)
		.join("\n");
	const bindings = new Map(
		externals.map((specifier, index) => [specifier, `__ext${String(index)}`]),
	);
	const next = bundled.replace(/__require\(["']([^"']+)["']\)/g, (_match, specifier: string) => {
		const binding = bindings.get(specifier);
		if (!binding) {
			throw new Error(`Unexpected external require: ${specifier}`);
		}
		return binding;
	});
	return `${imports}\n${next}`;
}

function appendNamedExports(bundled: string, names: readonly string[], extra = ""): string {
	const factoryMatch = bundled.match(/export default (require_\w+)\(\);/);
	if (!factoryMatch?.[1]) {
		throw new Error("Could not find default CJS factory in React bundle");
	}
	const named = names.map((name) => `export const ${name} = __mod.${name};`).join("\n");
	return `${bundled}
const __mod = ${factoryMatch[1]}();
${named}
${extra}
`;
}

export function shareSingleReact(): Plugin {
	const flavor = reactBuildFlavor();
	const reactRoot = packageDir("react");
	const reactDomRoot = packageDir("react-dom");
	const cache = new Map<string, string>();

	const entries: Record<
		(typeof sharedReactPackages)[number],
		{ file: string; names: readonly string[]; external: string[]; extra?: string }
	> = {
		react: {
			file: path.join(reactRoot, `cjs/react.${flavor}.js`),
			names: reactExportNames,
			external: [],
		},
		"react/jsx-runtime": {
			file: path.join(reactRoot, `cjs/react-jsx-runtime.${flavor}.js`),
			names: jsxRuntimeExportNames,
			external: ["react"],
		},
		"react/jsx-dev-runtime": {
			file: path.join(reactRoot, `cjs/react-jsx-dev-runtime.${flavor}.js`),
			names: jsxDevRuntimeExportNames,
			external: ["react"],
		},
		"react/compiler-runtime": {
			file: path.join(reactRoot, `cjs/react-compiler-runtime.${flavor}.js`),
			names: [],
			external: ["react"],
		},
		"react-dom": {
			file: path.join(reactDomRoot, `cjs/react-dom.${flavor}.js`),
			names: reactDomExportNames,
			external: ["react"],
		},
		"react-dom/client": {
			file: path.join(reactDomRoot, `cjs/react-dom-client.${flavor}.js`),
			names: reactDomClientExportNames,
			external: ["react", "react-dom"],
			extra: `export { createPortal, flushSync } from "react-dom";`,
		},
	};

	return {
		name: "share-single-react",
		enforce: "pre",
		resolveId(source) {
			const bare = virtualReactBareId(source);
			if (bare) {
				return `\0fn-react:${bare}`;
			}
		},
		async load(id) {
			if (!id.startsWith("\0fn-react:")) {
				return;
			}
			const bare = id.slice("\0fn-react:".length) as (typeof sharedReactPackages)[number];
			const cached = cache.get(bare);
			if (cached) {
				return cached;
			}
			const spec = entries[bare];
			const bundled = await esbuildBuild({
				entryPoints: [spec.file],
				bundle: true,
				format: "esm",
				platform: "browser",
				write: false,
				external: spec.external,
				logLevel: "silent",
				define: {
					"process.env.NODE_ENV": JSON.stringify(flavor),
				},
			});
			const code = bundled.outputFiles[0]?.text;
			if (!code) {
				throw new Error(`Failed to bundle ${spec.file}`);
			}
			const output = appendNamedExports(
				rewriteCjsRequires(code, spec.external),
				spec.names,
				spec.extra ?? "",
			);
			cache.set(bare, output);
			return output;
		},
	};
}

export function transpileRnPrimitivesJsx(): Plugin {
	return {
		name: "transpile-rn-primitives-jsx",
		enforce: "pre",
		async transform(code, id) {
			const filePath = id.split("?")[0] ?? id;
			if (!filePath.includes(`${path.sep}node_modules${path.sep}@rn-primitives${path.sep}`)) {
				return;
			}
			if (!/\.(mjs|js)$/u.test(filePath)) {
				return;
			}
			const result = await transform(code, {
				loader: "jsx",
				jsx: "automatic",
				sourcefile: filePath,
			});
			const bundled = await esbuildBuild({
				stdin: {
					contents: result.code,
					resolveDir: path.dirname(filePath),
					sourcefile: filePath,
					loader: "js",
				},
				bundle: true,
				format: "esm",
				platform: "neutral",
				write: false,
				logLevel: "silent",
				plugins: [
					{
						name: "externalize-non-entry",
						setup(build) {
							build.onResolve({ filter: /.*/ }, (args) => {
								if (args.kind === "entry-point") {
									return;
								}
								return { path: args.path, external: true };
							});
						},
					},
				],
			});
			const output = bundled.outputFiles[0]?.text;
			if (!output) {
				return { code: result.code, map: result.map || undefined };
			}
			return { code: output, map: undefined };
		},
	};
}

function namedExportsFromCjs(code: string): string[] {
	const names = new Set<string>();
	for (const match of code.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g)) {
		if (match[1] && match[1] !== "default") {
			names.add(match[1]);
		}
	}
	const blocks = [...code.matchAll(/\bmodule\.exports\s*=\s*\{([^}]*)\}/g)];
	const lastBlock = blocks.at(-1)?.[1];
	if (lastBlock) {
		for (const match of lastBlock.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) {
			if (match[1] && match[1] !== "default") {
				names.add(match[1]);
			}
		}
	}
	return [...names];
}

export function transpileCjsNodeModules(): Plugin {
	return {
		name: "transpile-cjs-node-modules",
		enforce: "pre",
		async transform(code, id) {
			const filePath = id.split("?")[0] ?? id;
			if (!filePath.includes(`${path.sep}node_modules${path.sep}`)) {
				return;
			}
			if (filePath.includes(`${path.sep}node_modules${path.sep}react${path.sep}`)) {
				return;
			}
			if (filePath.includes(`${path.sep}node_modules${path.sep}react-dom${path.sep}`)) {
				return;
			}
			if (filePath.includes(`${path.sep}node_modules${path.sep}react-native-web${path.sep}`)) {
				return;
			}
			if (!/\.c?js$/u.test(filePath)) {
				return;
			}
			if (/^\s*export\s/m.test(code) && !/\bmodule\.exports\b/.test(code)) {
				return;
			}
			const isCjs =
				/\bmodule\.exports\b/.test(code) ||
				/Object\.defineProperty\(\s*exports/.test(code) ||
				/\bexports\.\w+\s*=/.test(code);
			if (!isCjs) {
				return;
			}
			const result = await esbuildBuild({
				stdin: {
					contents: code,
					resolveDir: path.dirname(filePath),
					sourcefile: filePath,
					loader: "js",
				},
				bundle: true,
				format: "esm",
				platform: "neutral",
				packages: "external",
				write: false,
				logLevel: "silent",
			});
			const output = result.outputFiles[0]?.text;
			if (!output) {
				return;
			}
			if (filePath.includes(`${path.sep}react-native-svg${path.sep}`)) {
				const names = namedExportsFromCjs(code);
				if (names.length > 0) {
					try {
						return { code: appendNamedExports(output, names), map: undefined };
					} catch {
						return { code: output, map: undefined };
					}
				}
			}
			return { code: output, map: undefined };
		},
	};
}

function isRnSvgTransformPath(source: string, importer?: string): boolean {
	const clean = (source.split("?")[0] ?? source).replaceAll("\\", "/");
	if (clean.endsWith("/react-native-svg/lib/module/lib/extract/transform.js")) {
		return true;
	}
	if (!importer) {
		return false;
	}
	const importerPath = (importer.split("?")[0] ?? importer).replaceAll("\\", "/");
	if (!importerPath.includes("/react-native-svg/")) {
		return false;
	}
	const resolved = path.resolve(
		path.dirname(importer.split("?")[0] ?? importer),
		source.split("?")[0] ?? source,
	);
	return resolved
		.replaceAll("\\", "/")
		.endsWith("/react-native-svg/lib/module/lib/extract/transform.js");
}

const rnSvgTransformEsm = `
export class PegSyntaxError extends Error {
	name = "SyntaxError";
}
export { PegSyntaxError as SyntaxError };
export const StartRules = ["start"];
export function parse() {
	return [];
}
export default { SyntaxError: PegSyntaxError, StartRules, parse };
`;

export function esmifyReactNativeSvgTransform(): Plugin {
	return {
		name: "esmify-rn-svg-transform",
		enforce: "pre",
		resolveId(source, importer) {
			if (isRnSvgTransformPath(source, importer)) {
				return "\0rn-svg-transform";
			}
		},
		load(id) {
			if (id === "\0rn-svg-transform") {
				return rnSvgTransformEsm;
			}
		},
		transform(_code, id) {
			const clean = (id.split("?")[0] ?? id).replaceAll("\\", "/");
			if (clean.includes("/react-native-svg/") && clean.endsWith("/extract/transform.js")) {
				return { code: rnSvgTransformEsm, map: null };
			}
		},
	};
}

export function rewriteRnWebStyleqImports(): Plugin {
	const localize = JSON.stringify(path.join(storybookDir, "stubs/styleq-localize.js"));
	const main = JSON.stringify(path.join(storybookDir, "stubs/styleq.js"));
	return {
		name: "rewrite-rn-web-styleq-imports",
		enforce: "pre",
		transform(code, id) {
			const filePath = id.split("?")[0] ?? id;
			if (!filePath.includes(`${path.sep}react-native-web${path.sep}`)) {
				return;
			}
			let next = code;
			if (code.includes("styleq")) {
				next = next
					.replace(/from ["']styleq\/transform-localize-style["']/g, `from ${localize}`)
					.replace(/from ["']styleq["']/g, `from ${main}`);
			}
			if (code.includes("createPortal")) {
				next = next.replace(
					/import \{ createPortal \} from ["']react-dom["']/g,
					'import { createPortal } from "react-dom/client"',
				);
			}
			if (next === code) {
				return;
			}
			return { code: next, map: null };
		},
	};
}

export function resolveStyleqStubs(): Plugin {
	const styleqMain = path.join(storybookDir, "stubs/styleq.js");
	const styleqLocalize = path.join(storybookDir, "stubs/styleq-localize.js");
	return {
		name: "resolve-styleq-stubs",
		enforce: "pre",
		resolveId(id) {
			if (id === "styleq/transform-localize-style") {
				return styleqLocalize;
			}
			if (id === "styleq") {
				return styleqMain;
			}
		},
	};
}

export function rnWebAliases(): Record<string, string> {
	const rnSvgDir = packageDir("react-native-svg");
	return {
		"@": path.join(uiRoot, "src"),
		"react-native": "react-native-web",
		"react-native-svg": path.join(rnSvgDir, "lib/module/ReactNativeSVG.web.js"),
		[path.join(rnSvgDir, "lib/module/lib/extract/transform.js")]: path.join(
			storybookDir,
			"stubs/svg-transform.js",
		),
		[path.join(rnSvgDir, "lib/module/lib/extract/transformToRn.js")]: path.join(
			storybookDir,
			"stubs/svg-transform.js",
		),
		"@react-native/assets-registry/registry": path.join(storybookDir, "stubs/assets-registry.js"),
		"react-native/Libraries/Utilities/codegenNativeComponent": path.join(
			storybookDir,
			"stubs/codegen-native-component.js",
		),
		"react-native-web/Libraries/Utilities/codegenNativeComponent": path.join(
			storybookDir,
			"stubs/codegen-native-component.js",
		),
		"@react-native/normalize-colors": path.join(storybookDir, "stubs/normalize-colors.js"),
	};
}

export const rnWebExtensions = [
	".web.tsx",
	".web.ts",
	".web.jsx",
	".web.js",
	".tsx",
	".ts",
	".jsx",
	".js",
	".json",
];

export function rnWebOptimizeDeps(): NonNullable<UserConfig["optimizeDeps"]> {
	return {
		include: [
			"postcss-value-parser",
			"inline-style-prefixer",
			"css-in-js-utils",
			"inline-style-prefixer/lib/createPrefixer",
			"inline-style-prefixer/lib/plugins/crossFade",
			"inline-style-prefixer/lib/plugins/imageSet",
			"inline-style-prefixer/lib/plugins/logical",
			"inline-style-prefixer/lib/plugins/position",
			"inline-style-prefixer/lib/plugins/sizing",
			"inline-style-prefixer/lib/plugins/transition",
		],
		exclude: [
			...sharedReactPackages,
			"react-native",
			"react-native-web",
			"react-native-svg",
			"lucide-react-native",
			"styleq",
			"@react-native/normalize-colors",
			"@rn-primitives/accordion",
			"@rn-primitives/alert-dialog",
			"@rn-primitives/aspect-ratio",
			"@rn-primitives/avatar",
			"@rn-primitives/checkbox",
			"@rn-primitives/collapsible",
			"@rn-primitives/context-menu",
			"@rn-primitives/dialog",
			"@rn-primitives/dropdown-menu",
			"@rn-primitives/hover-card",
			"@rn-primitives/label",
			"@rn-primitives/menubar",
			"@rn-primitives/popover",
			"@rn-primitives/portal",
			"@rn-primitives/progress",
			"@rn-primitives/radio-group",
			"@rn-primitives/select",
			"@rn-primitives/separator",
			"@rn-primitives/slot",
			"@rn-primitives/switch",
			"@rn-primitives/tabs",
			"@rn-primitives/toggle",
			"@rn-primitives/toggle-group",
			"@rn-primitives/tooltip",
			"react-native-css",
		],
	};
}

const cssInteropComponents = new Set([
	"ActivityIndicator",
	"Button",
	"FlatList",
	"Image",
	"ImageBackground",
	"KeyboardAvoidingView",
	"Pressable",
	"ScrollView",
	"Switch",
	"Text",
	"TextInput",
	"TouchableHighlight",
	"TouchableOpacity",
	"TouchableWithoutFeedback",
	"View",
	"VirtualizedList",
]);

function rewriteNamedReactNativeImport(code: string, moduleName: string): string {
	const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*["']${escaped}["']`, "g");
	return code.replace(pattern, (_full, specifiers: string) => {
		const parts = specifiers
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean);
		const cssLines: string[] = [];
		const rest: string[] = [];
		for (const part of parts) {
			const typeOnly = /^type\s+/u.test(part);
			const body = typeOnly ? part.replace(/^type\s+/u, "") : part;
			const importedName = body.split(/\s+as\s+/u)[0]?.trim() ?? body;
			if (!typeOnly && cssInteropComponents.has(importedName)) {
				cssLines.push(`import { ${part} } from "react-native-css/components/${importedName}";`);
			} else {
				rest.push(part);
			}
		}
		const restLine = rest.length > 0 ? `import { ${rest.join(", ")} } from "${moduleName}";` : "";
		return [...cssLines, restLine].filter(Boolean).join("\n");
	});
}

export function rewriteReactNativeCssImports(): Plugin {
	return {
		name: "rewrite-react-native-css-imports",
		enforce: "pre",
		transform(code, id) {
			const filePath = id.split("?")[0] ?? id;
			if (filePath.includes(`${path.sep}react-native-css${path.sep}`)) {
				return;
			}
			if (!/\.(mjs|cjs|js|jsx|ts|tsx)$/u.test(filePath)) {
				return;
			}
			if (!code.includes("react-native")) {
				return;
			}

			let next = rewriteNamedReactNativeImport(code, "react-native");
			next = rewriteNamedReactNativeImport(next, "react-native-web");
			next = next.replaceAll(
				/\brequire\(["']react-native["']\)/g,
				'require("react-native-css/components")',
			);
			if (next === code) {
				return;
			}
			return { code: next, map: null };
		},
	};
}

export function applyRnWebVite(viteConfig: UserConfig): UserConfig {
	viteConfig.plugins = [
		shareSingleReact(),
		rewriteReactNativeCssImports(),
		esmifyReactNativeSvgTransform(),
		rewriteRnWebStyleqImports(),
		resolveStyleqStubs(),
		transpileRnPrimitivesJsx(),
		transpileCjsNodeModules(),
		...(viteConfig.plugins ?? []),
	];
	viteConfig.resolve = {
		...viteConfig.resolve,
		alias: {
			...normalizeAlias(viteConfig.resolve?.alias),
			...rnWebAliases(),
		},
		extensions: rnWebExtensions,
		dedupe: ["react", "react-dom"],
	};
	viteConfig.optimizeDeps = {
		...viteConfig.optimizeDeps,
		...rnWebOptimizeDeps(),
		include: [
			...(viteConfig.optimizeDeps?.include ?? []),
			...(rnWebOptimizeDeps().include ?? []),
		].filter((dep) => !(sharedReactPackages as readonly string[]).includes(dep)),
		exclude: [...(viteConfig.optimizeDeps?.exclude ?? []), ...(rnWebOptimizeDeps().exclude ?? [])],
	};
	return viteConfig;
}

export function normalizeAlias(alias: unknown): Record<string, string> {
	if (!alias || Array.isArray(alias)) {
		return {};
	}
	return alias as Record<string, string>;
}

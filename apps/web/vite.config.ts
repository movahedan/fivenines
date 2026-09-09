import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import {
	esmifyReactNativeSvgTransform,
	preferNodeModuleEsmPlugin,
	resolveStyleqStubs,
	rewriteReactNativeCssImports,
	rewriteReanimatedBrowserGlobals,
	rewriteRnWebStyleqImports,
	rnWebAliases,
	rnWebExtensions,
	rnWebGlobalDefines,
	rnWebOptimizeDeps,
	rnWebSsrNoExternal,
	shareSingleReact,
	stubReanimatedWorkletsVersionCheck,
	transpileCjsNodeModules,
	transpileRnPrimitivesJsx,
} from "../../packages/ui/scripts/rn-web.ts";

const webConfigDir = path.dirname(fileURLToPath(import.meta.url));
const ssrRnWebStub = path.join(webConfigDir, "src/ssr-rn-web-stub.tsx");

const ssrCssComponentPrefix = "\0ssr-rn-css-component:";

function stubRnWebOnSsr(): Plugin {
	return {
		name: "stub-rn-web-on-ssr",
		enforce: "pre",
		resolveId(source) {
			if (this.environment.name !== "ssr") {
				return;
			}
			const cssComponent = /^react-native-css\/components\/([A-Za-z_][A-Za-z0-9_]*)$/.exec(source);
			if (cssComponent?.[1]) {
				return `${ssrCssComponentPrefix}${cssComponent[1]}`;
			}
			if (
				source === "react-native" ||
				source === "react-native-web" ||
				source.startsWith("react-native-web/") ||
				source === "react-native-css" ||
				source.startsWith("react-native-css/")
			) {
				return ssrRnWebStub;
			}
		},
		load(id) {
			if (!id.startsWith(ssrCssComponentPrefix)) {
				return;
			}
			const exportName = id.slice(ssrCssComponentPrefix.length);
			const stub = JSON.stringify(ssrRnWebStub);
			return `import { Box } from ${stub};\nexport const ${exportName} = Box;\nexport default Box;\n`;
		},
	};
}

const ssrPwaStub = "\0ssr-pwa-register";

function stubPwaOnSsr(): Plugin {
	return {
		name: "stub-pwa-on-ssr",
		enforce: "pre",
		resolveId(source) {
			if (this.environment.name !== "ssr") {
				return;
			}
			if (source === "workbox-window" || source.includes("virtual:pwa-register")) {
				return ssrPwaStub;
			}
		},
		load(id) {
			if (id !== ssrPwaStub) {
				return;
			}
			return "export function registerSW() {\n\treturn () => {};\n}\n";
		},
	};
}

const webPort = Number(process.env.WEB_PORT ?? process.env.PORT ?? "3000");

const requireFromWeb = createRequire(import.meta.url);

function installedWebPackageDir(specifier: string): string {
	return path.dirname(requireFromWeb.resolve(`${specifier}/package.json`));
}

const reactNativeWebEntry = path.join(installedWebPackageDir("react-native-web"), "dist/index.js");
const useSyncExternalStoreRoot = installedWebPackageDir("use-sync-external-store");
const reactPrebundleIds = [
	"react",
	"react-dom",
	"react-dom/client",
	"react/jsx-runtime",
	"react/jsx-dev-runtime",
	"react/compiler-runtime",
] as const;

const rnOptimizeDeps = rnWebOptimizeDeps();
const rnJsxExclude = (rnOptimizeDeps.exclude ?? []).filter(
	(dep) =>
		!(reactPrebundleIds as readonly string[]).includes(dep) &&
		dep !== "react-native-web" &&
		dep !== "react-native-css",
);

export default defineConfig(({ command }) => {
	const shareReact = command === "serve";
	const withSelectorFlavor = command === "build" ? "production" : "development";
	const withSelectorCjs = path.join(
		useSyncExternalStoreRoot,
		`cjs/use-sync-external-store-shim/with-selector.${withSelectorFlavor}.js`,
	);

	return {
		server: {
			port: webPort,
			allowedHosts: ["localhost", "web", "play.fivenines.com", "auth.fivenines.com"],
		},
		preview: {
			port: webPort,
		},
		define: rnWebGlobalDefines(command === "build" ? "production" : "development"),
		resolve: {
			alias: {
				...rnWebAliases(),
				"react-native": reactNativeWebEntry,
				"workbox-window": path.join(
					installedWebPackageDir("workbox-window"),
					"build/workbox-window.prod.es5.mjs",
				),
				"use-sync-external-store/shim/with-selector": withSelectorCjs,
				"use-sync-external-store/shim/with-selector.js": withSelectorCjs,
			},
			extensions: rnWebExtensions,
			dedupe: ["react", "react-dom"],
		},
		optimizeDeps: {
			include: [
				...(rnOptimizeDeps.include ?? []),
				"react-native-web",
				"react-native-css",
				...(shareReact ? [] : [...reactPrebundleIds]),
			],
			exclude: shareReact ? [...rnJsxExclude, ...reactPrebundleIds] : rnJsxExclude,
		},
		ssr: {
			noExternal: rnWebSsrNoExternal,
			optimizeDeps: {
				exclude: shareReact ? [...rnJsxExclude, ...reactPrebundleIds] : rnJsxExclude,
			},
		},
		environments: {
			ssr: {
				resolve: {
					alias: {
						"react-native": ssrRnWebStub,
						"react-native-web": ssrRnWebStub,
					},
				},
			},
		},
		plugins: [
			stubRnWebOnSsr(),
			stubPwaOnSsr(),
			...(shareReact ? [shareSingleReact()] : []),
			preferNodeModuleEsmPlugin(),
			stubReanimatedWorkletsVersionCheck(),
			rewriteReanimatedBrowserGlobals(),
			rewriteReactNativeCssImports(),
			esmifyReactNativeSvgTransform(),
			rewriteRnWebStyleqImports(),
			resolveStyleqStubs(),
			transpileRnPrimitivesJsx(),
			transpileCjsNodeModules(),
			tanstackStart({
				spa: {
					enabled: true,
				},
				prerender: {
					autoStaticPathsDiscovery: false,
				},
				router: {
					routeFileIgnorePattern: String.raw`\.test\.tsx$`,
				},
			}),
			viteReact(),
			tailwindcss(),
			VitePWA({
				registerType: "autoUpdate",
				injectRegister: false,
				strategies: "generateSW",
				manifestFilename: "manifest.json",
				includeAssets: [
					"og.svg",
					"logo192.png",
					"logo512.png",
					"silktide/*",
					"gtag-consent-default.js",
				],
				devOptions: {
					enabled: false,
				},
				workbox: {
					globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,json}"],
					navigateFallback: "/_shell.html",
				},
				manifest: {
					name: "Five Nines",
					short_name: "Five Nines",
					description: "Cloud tycoon ops console",
					theme_color: "#0b1220",
					background_color: "#0b1220",
					display: "standalone",
					start_url: "/",
					scope: "/",
					icons: [
						{
							src: "logo192.png",
							sizes: "192x192",
							type: "image/png",
						},
						{
							src: "logo512.png",
							sizes: "512x512",
							type: "image/png",
						},
					],
					shortcuts: [
						{
							name: "Play",
							short_name: "Play",
							description: "Open the ops console",
							url: "/hub",
							icons: [
								{
									src: "logo192.png",
									sizes: "192x192",
									type: "image/png",
								},
							],
						},
					],
				},
			}),
		],
	};
});

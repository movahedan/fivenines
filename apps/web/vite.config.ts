import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PreviewServer, type ViteDevServer } from "vite";

import {
	esmifyReactNativeSvgTransform,
	resolveStyleqStubs,
	rewriteReactNativeCssImports,
	rewriteRnWebStyleqImports,
	rnWebAliases,
	rnWebExtensions,
	rnWebOptimizeDeps,
	shareSingleReact,
	transpileCjsNodeModules,
	transpileRnPrimitivesJsx,
} from "../../packages/ui/.storybook/rn-web-vite.ts";
import { acceptIncludesJson, isLivenessPath, processStatusBody } from "./src/liveness.ts";

const webPort = Number(process.env.WEB_PORT ?? process.env.PORT ?? "3000");

function requestPathname(req: IncomingMessage): string {
	const path = req.url?.split("?")[0];
	return path === undefined || path === "" ? "/" : path;
}

function sendStatusJson(res: ServerResponse): void {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(processStatusBody()));
}

function attachJsonStatusWhenAccepted(server: ViteDevServer | PreviewServer): void {
	server.middlewares.use((req, res, next) => {
		if (
			req.method === "GET" &&
			isLivenessPath(requestPathname(req)) &&
			acceptIncludesJson(req.headers.accept)
		) {
			sendStatusJson(res);
			return;
		}

		next();
	});
}

const requireFromWeb = createRequire(import.meta.url);
const reactNativeWebEntry = path.join(
	path.dirname(requireFromWeb.resolve("react-native-web/package.json")),
	"dist/index.js",
);
const useSyncExternalStoreRoot = path.dirname(
	requireFromWeb.resolve("use-sync-external-store/package.json"),
);
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
		resolve: {
			alias: {
				...rnWebAliases(),
				"react-native": reactNativeWebEntry,
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
			optimizeDeps: {
				exclude: shareReact ? [...rnJsxExclude, ...reactPrebundleIds] : rnJsxExclude,
			},
		},
		plugins: [
			...(shareReact ? [shareSingleReact()] : []),
			rewriteReactNativeCssImports(),
			esmifyReactNativeSvgTransform(),
			rewriteRnWebStyleqImports(),
			resolveStyleqStubs(),
			transpileRnPrimitivesJsx(),
			transpileCjsNodeModules(),
			{
				name: "status-json",
				configureServer: attachJsonStatusWhenAccepted,
				configurePreviewServer: attachJsonStatusWhenAccepted,
			},
			tanstackStart({
				router: {
					routeFileIgnorePattern: String.raw`\.test\.tsx$`,
				},
			}),
			viteReact(),
			tailwindcss(),
		],
	};
});

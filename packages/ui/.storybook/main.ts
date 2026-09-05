import type { IncomingMessage, ServerResponse } from "node:http";

import type { StorybookConfig } from "@storybook/react-vite";
import type { Plugin, ViteDevServer } from "vite";

import { applyRnWebVite } from "./rn-web-vite.ts";

const config: StorybookConfig = {
	stories: ["../src/molecules/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	core: {
		disableTelemetry: true,
	},
	typescript: {
		check: false,
		reactDocgen: "react-docgen-typescript",
		reactDocgenTypescriptOptions: {
			shouldExtractLiteralValuesFromEnum: true,
			propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
		},
	},
	async viteFinal(viteConfig) {
		const port = Number(process.env.UI_PORT ?? process.env.PORT ?? 9000);
		const host = process.env.HOST ?? "127.0.0.1";
		viteConfig.server = {
			...viteConfig.server,
			port,
			host: host === "0.0.0.0" ? true : host,
			allowedHosts: ["localhost", "127.0.0.1", "ui"],
			strictPort: true,
		};
		const plugins = viteConfig.plugins ?? [];
		viteConfig.plugins = [statusJsonAlwaysPlugin(), ...plugins];
		applyRnWebVite(viteConfig);
		return viteConfig;
	},
};

function sendStatusJson(res: ServerResponse): void {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
}

function statusJsonAlwaysPlugin(): Plugin {
	return {
		name: "ui-status-json",
		configureServer(server: ViteDevServer) {
			server.middlewares.use((req: IncomingMessage, res, next) => {
				const path = req.url?.split("?")[0];
				if (req.method === "GET" && path === "/status") {
					sendStatusJson(res);
					return;
				}

				next();
			});
		},
	};
}

export default config;

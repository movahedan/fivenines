import type { IncomingMessage, ServerResponse } from "node:http";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PreviewServer, type ViteDevServer } from "vite";

const webPort = Number(process.env.WEB_PORT ?? process.env.PORT ?? "3000");

function isStatusGet(req: IncomingMessage): boolean {
	if (req.method !== "GET") {
		return false;
	}

	const path = req.url?.split("?")[0];
	return path === "/status";
}

function acceptIncludesJson(req: IncomingMessage): boolean {
	const accept = req.headers.accept;
	return typeof accept === "string" && accept.includes("application/json");
}

function sendStatusJson(res: ServerResponse): void {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
}

function attachJsonStatusWhenAccepted(server: ViteDevServer | PreviewServer): void {
	server.middlewares.use((req, res, next) => {
		if (isStatusGet(req) && acceptIncludesJson(req)) {
			sendStatusJson(res);
			return;
		}

		next();
	});
}

export default defineConfig({
	server: {
		port: webPort,
		allowedHosts: ["localhost", "web", "play.fivenines.com"],
	},
	preview: {
		port: webPort,
	},
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	plugins: [
		{
			name: "status-json",
			configureServer: attachJsonStatusWhenAccepted,
			configurePreviewServer: attachJsonStatusWhenAccepted,
		},
		tanstackStart({
			router: {
				routeFileIgnorePattern: "\\.test\\.tsx$",
			},
		}),
		viteReact(),
		tailwindcss(),
	],
});

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const webPort = Number(process.env.WEB_PORT ?? "3001");

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
	plugins: [tanstackStart(), viteReact(), tailwindcss()],
});

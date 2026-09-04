import path from "node:path";

import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "../src"),
		},
	},
	css: {
		postcss: {
			plugins: [tailwindcss()],
		},
	},
});

import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

import { applyRnWebVite } from "./rn-web-vite.ts";

export default defineConfig(
	applyRnWebVite({
		css: {
			postcss: {
				plugins: [tailwindcss()],
			},
		},
	}),
);

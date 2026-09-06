import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

import { applyRnWebVite } from "../scripts/rn-web.ts";

export default defineConfig(
	applyRnWebVite({
		css: {
			postcss: {
				plugins: [tailwindcss()],
			},
		},
	}),
);

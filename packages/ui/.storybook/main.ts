import type { StorybookConfig } from "@storybook/react-vite";

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
		const port = Number(process.env.UI_PORT ?? process.env.PORT ?? 3004);
		const host = process.env.HOST ?? "127.0.0.1";
		viteConfig.server = {
			...viteConfig.server,
			port,
			host: host === "0.0.0.0" ? true : host,
			allowedHosts: ["localhost", "127.0.0.1", "ui"],
			strictPort: true,
		};
		applyRnWebVite(viteConfig);
		return viteConfig;
	},
};

export default config;

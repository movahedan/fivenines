import type { Preview } from "@storybook/react";
// biome-ignore lint/correctness/noUnusedImports: storybook JSX
import React from "react";

import "../src/style.css";

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: "^on[A-Z].*" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
			},
		},
		backgrounds: {
			default: "ops",
			values: [
				{
					name: "ops",
					value: "#050912",
				},
				{
					name: "hud",
					value: "#060c1e",
				},
			],
		},
		docs: {
			toc: true,
		},
	},
	globalTypes: {
		theme: {
			description: "Global theme for components",
			defaultValue: "dark",
			toolbar: {
				title: "Theme",
				icon: "circlehollow",
				items: ["dark"],
				dynamicTitle: true,
			},
		},
	},
	decorators: [
		(Story, context) => {
			const fullscreen = context.parameters.layout === "fullscreen";

			return (
				<div
					className="bg-background font-sans text-foreground"
					style={
						fullscreen
							? {
									height: "100vh",
									overflow: "hidden",
									padding: 0,
									display: "flex",
									flexDirection: "column",
								}
							: { padding: "1rem" }
					}
				>
					<Story />
				</div>
			);
		},
	],
};

export default preview;

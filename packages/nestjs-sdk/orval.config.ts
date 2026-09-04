import { defineConfig } from "orval";

const input = {
	target: "./src/openapi.yaml",
};

const fetchMutator = {
	includeHttpResponseReturnType: false as const,
};

export default defineConfig({
	nestjsServer: {
		input,
		output: {
			mode: "tags-split",
			target: "./src/gen/server/endpoints.ts",
			schemas: "./src/gen/model",
			client: "fetch",
			httpClient: "fetch",
			clean: true,
			indexFiles: true,
			override: {
				mutator: {
					path: "./src/mutator.server.ts",
					name: "customFetch",
				},
				fetch: fetchMutator,
			},
		},
	},
	nestjsClient: {
		input,
		output: {
			mode: "tags-split",
			target: "./src/gen/hooks/endpoints.ts",
			schemas: {
				path: "./src/gen/model",
				importPath: "@packages/nestjs-sdk",
			},
			client: "react-query",
			httpClient: "fetch",
			clean: true,
			indexFiles: true,
			override: {
				mutator: {
					path: "./src/mutator.client.ts",
					name: "customFetch",
				},
				fetch: fetchMutator,
				query: {
					useQuery: true,
				},
			},
		},
	},
	nestjsZod: {
		input,
		output: {
			mode: "tags-split",
			target: "./src/gen/zod/endpoints.ts",
			client: "zod",
			fileExtension: ".zod.ts",
			clean: true,
			indexFiles: true,
		},
	},
});

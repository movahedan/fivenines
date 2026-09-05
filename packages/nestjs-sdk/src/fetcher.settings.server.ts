import { defaultFetcherSettingsInput, FetcherSettings } from "@packages/http";

function getApiBaseUrl(): string {
	const url = process.env.NESTJS_API_URL;
	if (url === undefined || url === "") {
		throw new Error("Missing required env: NESTJS_API_URL");
	}

	return url;
}

export const serverBaseSettings = new FetcherSettings({
	config: {
		...defaultFetcherSettingsInput.config,
		baseRequestConfig: {
			...defaultFetcherSettingsInput.config?.baseRequestConfig,
			baseURL: getApiBaseUrl(),
		},
	},
	callbacks: defaultFetcherSettingsInput.callbacks,
});

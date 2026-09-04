import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactElement } from "react";

import { defaultFetcherSettingsInput } from "@packages/http";
import { FetcherSettingsProvider } from "@packages/http/react";

import { getBrowserApiBaseUrl } from "../browser-api-base-url";
import type { WebRouterContext } from "../router-context";

import "@packages/ui/style.css";

function RootDocument(): ReactElement {
	const { queryClient } = Route.useRouteContext();

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					<FetcherSettingsProvider
						initialSettings={{
							config: {
								...defaultFetcherSettingsInput.config,
								baseRequestConfig: {
									...defaultFetcherSettingsInput.config?.baseRequestConfig,
									baseURL: getBrowserApiBaseUrl(),
								},
							},
						}}
					>
						<Outlet />
					</FetcherSettingsProvider>
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	);
}

export const Route = createRootRouteWithContext<WebRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Five Nines" },
		],
	}),
	component: RootDocument,
	notFoundComponent: () => <p>Not found</p>,
});

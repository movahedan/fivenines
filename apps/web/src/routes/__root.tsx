import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactElement } from "react";

import { createAuthFetcherBindings } from "@packages/auth";
import { AuthProvider } from "@packages/auth/react";
import { defaultFetcherSettingsInput } from "@packages/http";
import { FetcherSettingsProvider } from "@packages/http/react";
import { getAppOrigin, getAuthOrigin } from "@packages/utils/origins";

import { getBrowserApiBaseUrl } from "../browser-api-base-url";
import { playerAuthSession } from "../player-session";
import type { WebRouterContext } from "../router-context";

import "@packages/ui/style.css";

const authFetch = createAuthFetcherBindings(playerAuthSession);

function RootDocument(): ReactElement {
	const { queryClient } = Route.useRouteContext();

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					<AuthProvider
						session={playerAuthSession}
						restoreOnMount={false}
						callbackPath="/hub"
						authOrigin={getAuthOrigin(import.meta.env.VITE_AUTH_URL)}
						appOrigin={getAppOrigin(import.meta.env.VITE_APP_ORIGIN)}
					>
						<FetcherSettingsProvider
							initialSettings={{
								config: {
									...defaultFetcherSettingsInput.config,
									...authFetch,
									baseRequestConfig: {
										...defaultFetcherSettingsInput.config?.baseRequestConfig,
										baseURL: getBrowserApiBaseUrl(),
										credentials: "include",
									},
								},
							}}
						>
							<Outlet />
						</FetcherSettingsProvider>
					</AuthProvider>
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

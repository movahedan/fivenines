import { QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactElement } from "react";

import { createAuthFetcherBindings } from "@packages/auth";
import { AuthProvider } from "@packages/auth/react";
import { defaultFetcherSettingsInput } from "@packages/http";
import { FetcherSettingsProvider } from "@packages/http/react";

import { getBrowserApiBaseUrl } from "../browser-api-base-url";
import { playerAuthSession } from "../player-session";
import type { WebRouterContext } from "../router-context";

import "@packages/ui/style.css";

const authFetch = createAuthFetcherBindings(playerAuthSession);

function RootError({ error }: ErrorComponentProps) {
	return (
		<main className="min-h-screen bg-background p-8 font-sans text-foreground">
			<h1 className="text-lg font-semibold">Something went wrong</h1>
			<p className="mt-4 font-mono text-sm text-destructive">{error.message}</p>
		</main>
	);
}

function RootDocument(): ReactElement {
	const { queryClient } = Route.useRouteContext();

	return (
		<html lang="en" className="h-full bg-background">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-full bg-background font-sans text-foreground">
				<QueryClientProvider client={queryClient}>
					<AuthProvider
						session={playerAuthSession}
						restoreOnMount={false}
						authOrigin={import.meta.env.VITE_AUTH_URL}
						appOrigin={import.meta.env.VITE_APP_ORIGIN}
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
	errorComponent: RootError,
	notFoundComponent: () => <p>Not found</p>,
});

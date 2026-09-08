import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactElement, type ReactNode, useState } from "react";

import { createAuthFetcherBindings } from "@packages/auth";
import { AuthProvider } from "@packages/auth/react";
import { defaultFetcherSettingsInput } from "@packages/http";
import { FetcherSettingsProvider } from "@packages/http/react";

import { getBrowserApiBaseUrl } from "../browser-api-base-url";
import { playerAuthSession } from "../player-session";
import { viteAppOrigin, viteAuthOrigin } from "../vite-origins";
import { playReturnOrigin } from "./play-return-origin";

const authFetch = createAuthFetcherBindings(playerAuthSession);

export interface PlayProvidersProps {
	readonly children: ReactNode;
}

export function PlayProviders({ children }: PlayProvidersProps): ReactElement {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60_000,
					},
				},
			}),
	);

	const authOrigin = viteAuthOrigin();
	const appOrigin = playReturnOrigin(
		authOrigin,
		viteAppOrigin(),
		typeof window === "undefined" ? undefined : window.location.origin,
	);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider
				session={playerAuthSession}
				restoreOnMount={false}
				authOrigin={authOrigin}
				appOrigin={appOrigin}
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
					{children}
				</FetcherSettingsProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

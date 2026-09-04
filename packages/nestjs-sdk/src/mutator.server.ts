import { createFetcher, type Fetcher, type FetcherRuntimeContext } from "@packages/http";

import { serverBaseSettings } from "./fetcher.settings.server";

export type { Fetcher, RequestOptions, ResponseErrorConfig } from "@packages/http";

export function createServerClient(ctx: FetcherRuntimeContext): Fetcher {
	return createFetcher(serverBaseSettings, { ...ctx, mode: "server" });
}

export const publicServerClient = createFetcher(serverBaseSettings, { mode: "static" });

export async function customFetch<TData>(url: string, init?: RequestInit): Promise<TData> {
	return publicServerClient<TData>(url, init);
}

export type ErrorType<TError> = TError;

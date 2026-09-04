import { fetcher } from "@packages/http";

export type { Fetcher, RequestOptions, ResponseErrorConfig } from "@packages/http";

export async function customFetch<TData>(url: string, init?: RequestInit): Promise<TData> {
	return fetcher<TData>(url, init);
}

export type ErrorType<TError> = TError;

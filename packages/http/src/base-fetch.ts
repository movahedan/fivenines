export type RequestCredentials = "omit" | "same-origin" | "include";

export type RequestMethod = "GET" | "PUT" | "PATCH" | "POST" | "DELETE" | "OPTIONS" | "HEAD";

export interface RequestOptions {
	readonly baseURL?: string;
	readonly url: string;
	readonly method?: RequestMethod;
	readonly params?: Record<string, string | number | boolean | null | undefined>;
	readonly data?: unknown;
	readonly signal?: AbortSignal;
	readonly headers?: Record<string, string>;
	readonly credentials?: RequestCredentials;
	readonly dontCache?: boolean;
	readonly refreshed?: boolean;
	readonly skipDedupe?: boolean;
}

export interface HttpResult<TData = unknown> {
	readonly data: TData;
	readonly status: number;
	readonly statusText: string;
	readonly headers: Headers;
}

export type Fetcher = <TData = unknown>(url: string, init?: RequestInit) => Promise<TData>;

export type ExecuteRequest = <TData = unknown>(
	options: RequestOptions,
) => Promise<HttpResult<TData>>;

function headersToRecord(headers: RequestOptions["headers"] | undefined): Record<string, string> {
	if (headers === undefined) {
		return {};
	}
	return { ...headers };
}

const mergeHeaders = (
	globalHeaders: RequestOptions["headers"] | undefined,
	paramsHeaders: RequestOptions["headers"] | undefined,
): Record<string, string> => ({
	...headersToRecord(globalHeaders),
	...headersToRecord(paramsHeaders),
});

const appendQueryParams = (targetUrl: string, params: unknown): string => {
	if (!params || typeof params !== "object") {
		return targetUrl;
	}
	const normalizedParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
		if (value === undefined) {
			continue;
		}
		normalizedParams.append(key, value === null ? "null" : String(value));
	}
	const qs = normalizedParams.toString();
	return qs ? `${targetUrl}?${qs}` : targetUrl;
};

export const baseFetch: ExecuteRequest = async <TData = unknown>(
	paramsConfig: RequestOptions,
): Promise<HttpResult<TData>> => {
	const config = {
		...paramsConfig,
		headers: mergeHeaders(undefined, paramsConfig.headers),
	};

	let targetUrl = [config.baseURL, config.url].filter(Boolean).join("");
	targetUrl = appendQueryParams(targetUrl, config.params);

	const response = await fetch(targetUrl, {
		credentials: config.credentials ?? "same-origin",
		method: config.method?.toUpperCase(),
		body: config.data instanceof FormData ? config.data : JSON.stringify(config.data),
		signal: config.signal,
		headers: config.headers,
	});

	const data =
		[204, 205, 304].includes(response.status) || !response.body ? {} : await response.json();

	return {
		data: data as TData,
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	};
};

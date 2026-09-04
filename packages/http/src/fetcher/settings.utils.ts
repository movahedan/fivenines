import type { RequestOptions } from "../base-fetch";
import type {
	AfterErrorCallback,
	AfterResponseCallback,
	AttachAccessToken,
	BeforeRequestCallback,
	FetcherCallbacks,
	FetcherSettingsConfig,
	RefreshConfig,
	RequestMethod,
} from "./types";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);

function headersToRecord(headers: RequestOptions["headers"] | undefined): Record<string, string> {
	if (headers === undefined || headers === null) return {};
	return { ...headers };
}

function deepMergeConcatArrays<T>(base: T, scope: T): T {
	if (scope === undefined || scope === null) return base;
	if (Array.isArray(base) && Array.isArray(scope)) return [...base, ...scope] as T;
	if (isPlainObject(base) && isPlainObject(scope)) {
		const out: Record<string, unknown> = { ...base };
		for (const key of Object.keys(scope)) {
			const s = scope[key];
			if (s === undefined) continue;
			const b = base[key];
			out[key] = deepMergeConcatArrays(b, s as never);
		}
		return out as T;
	}
	return scope;
}

export const runners = {
	async beforeRequest(
		callbacks: readonly BeforeRequestCallback[],
		initialRequest: RequestOptions,
	): Promise<RequestOptions> {
		let request = initialRequest;
		for (const cb of callbacks) {
			request = await cb(request);
		}
		return request;
	},

	async afterResponse<TData, TError>(
		callbacks: readonly AfterResponseCallback[],
		input: {
			readonly request: RequestOptions;
			readonly response?: TData;
			readonly error?: TError;
		},
	): Promise<{ readonly response?: TData; readonly error?: TError }> {
		let current: { readonly response?: TData; readonly error?: TError } = {};
		if (input.response !== undefined) {
			current = { ...input, ...current };
		}
		if (input.error !== undefined) {
			current = { ...input, ...current };
		}
		for (const cb of callbacks) {
			current = await cb({
				request: input.request,
				...current,
			});
		}
		return current;
	},

	async afterError<TError>(
		callbacks: readonly AfterErrorCallback[],
		request: RequestOptions,
		initialError: TError,
	): Promise<TError> {
		let error = initialError;
		for (const cb of callbacks) {
			const out = await cb({ request, error });
			if (out.error !== undefined) {
				error = out.error as TError;
			}
		}
		return error;
	},
};

export const callbacksUtils = {
	concat(base: FetcherCallbacks, scope: Partial<FetcherCallbacks> | undefined): FetcherCallbacks {
		if (!scope) {
			return base;
		}
		return {
			beforeRequest: [...base.beforeRequest, ...(scope.beforeRequest ?? [])],
			afterResponse: [...base.afterResponse, ...(scope.afterResponse ?? [])],
			afterError: [...base.afterError, ...(scope.afterError ?? [])],
		};
	},

	resolve(defaults: FetcherCallbacks, input?: Partial<FetcherCallbacks>): FetcherCallbacks {
		return {
			beforeRequest: [...(input?.beforeRequest ?? defaults.beforeRequest)],
			afterResponse: [...(input?.afterResponse ?? defaults.afterResponse)],
			afterError: [...(input?.afterError ?? defaults.afterError)],
		};
	},
};

export const settingsUtils = {
	merge(base: FetcherSettingsConfig, scope: Partial<FetcherSettingsConfig>): FetcherSettingsConfig {
		const baseRequestConfig = deepMergeConcatArrays(
			(base.baseRequestConfig ?? {}) as Record<string, unknown>,
			(scope.baseRequestConfig ?? {}) as Record<string, unknown>,
		) as Partial<RequestOptions>;

		let refreshConfig: RefreshConfig | undefined;
		if (base.refreshConfig !== undefined || scope.refreshConfig !== undefined) {
			const merged = deepMergeConcatArrays(
				(base.refreshConfig ?? {}) as Record<string, unknown>,
				(scope.refreshConfig ?? {}) as Record<string, unknown>,
			);
			refreshConfig = Object.keys(merged).length > 0 ? merged : undefined;
		}

		const execute = scope.execute ?? base.execute;
		const attachAccessToken: AttachAccessToken | undefined =
			scope.attachAccessToken ?? base.attachAccessToken;

		return {
			...(Object.keys(baseRequestConfig).length > 0 ? { baseRequestConfig } : {}),
			...(execute ? { execute } : {}),
			...(refreshConfig ? { refreshConfig } : {}),
			...(attachAccessToken ? { attachAccessToken } : {}),
		};
	},
};

export const requestConfigUtils = {
	merge(
		baseRequestConfig: Partial<RequestOptions> | undefined,
		request: RequestOptions,
	): RequestOptions {
		return {
			...baseRequestConfig,
			...request,
			headers: {
				...headersToRecord(baseRequestConfig?.headers),
				...headersToRecord(request.headers),
			},
		};
	},

	toRequestOptions(config: RequestOptions): RequestOptions {
		if (!config.url) {
			throw new Error("Generated endpoint URL is required");
		}
		const normalized = headersToRecord(config.headers);
		const headers = Object.keys(normalized).length > 0 ? normalized : undefined;
		return {
			...(config.baseURL ? { baseURL: config.baseURL } : {}),
			method: requestConfigUtils.resolveMethod(config.method),
			url: config.url,
			...(config.credentials ? { credentials: config.credentials } : {}),
			...(config.data ? { data: config.data } : {}),
			...(config.params
				? { params: config.params as Record<string, string | number | boolean | null | undefined> }
				: {}),
			...(headers ? { headers } : {}),
			...(config.signal ? { signal: config.signal } : {}),
			...(config.dontCache ? { dontCache: true } : {}),
			...(config.refreshed ? { refreshed: true } : {}),
			...(config.skipDedupe ? { skipDedupe: true } : {}),
		};
	},

	resolveMethod(method: string | undefined): RequestMethod {
		const resolvedMethod = (method ?? "GET").toUpperCase();
		if (
			resolvedMethod === "POST" ||
			resolvedMethod === "PUT" ||
			resolvedMethod === "PATCH" ||
			resolvedMethod === "DELETE" ||
			resolvedMethod === "OPTIONS" ||
			resolvedMethod === "HEAD"
		) {
			return resolvedMethod;
		}
		return "GET";
	},
};

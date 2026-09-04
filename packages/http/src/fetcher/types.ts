import type { ApiError } from "../api-error";
import type { ExecuteRequest, RequestOptions } from "../base-fetch";

export type { ApiError, ApiFieldErrorRow } from "../api-error";
export type {
	ExecuteRequest,
	Fetcher,
	HttpResult,
	RequestCredentials,
	RequestMethod,
	RequestOptions,
} from "../base-fetch";

export interface RequestExecutionOptions extends RequestOptions {
	readonly key: string;
}

export interface RefreshCoordination {
	readonly isRefreshInFlight: () => boolean;
	readonly waitForRefresh: () => Promise<void>;
}

export interface RefreshConfig {
	readonly refresh?: () => Promise<void>;
	readonly shouldRefresh?: (options: RequestOptions) => boolean;
	readonly refreshCoordination?: RefreshCoordination;
}

export type AttachAccessToken = (
	options: RequestOptions,
) => Promise<RequestOptions> | RequestOptions;

export type BeforeRequestCallback = (
	request: RequestOptions,
) => Promise<RequestOptions> | RequestOptions;

export type AfterResponseCallback = <TData = unknown, TError = unknown>(input: {
	readonly request: RequestOptions;
	readonly response?: TData;
	readonly error?: TError;
}) =>
	| Promise<{ readonly response?: TData; readonly error?: TError }>
	| { readonly response?: TData; readonly error?: TError };

export type AfterErrorCallback = <TError = unknown>(input: {
	readonly request: RequestOptions;
	readonly error: TError;
}) => Promise<{ readonly error?: unknown }> | { readonly error?: unknown };

export interface FetcherCallbacks {
	readonly beforeRequest: readonly BeforeRequestCallback[];
	readonly afterResponse: readonly AfterResponseCallback[];
	readonly afterError: readonly AfterErrorCallback[];
}

export interface FetcherSettingsConfig {
	readonly baseRequestConfig?: Partial<RequestOptions>;
	readonly execute?: ExecuteRequest;
	readonly refreshConfig?: RefreshConfig;
	readonly attachAccessToken?: AttachAccessToken;
}

export type FetcherPlainMergeInput = {
	readonly config?: Partial<FetcherSettingsConfig>;
	readonly callbacks?: Partial<FetcherCallbacks>;
};

export type FetcherSettingsRootApplyInput = FetcherPlainMergeInput & {
	readonly mode?: "merge" | "replace";
};

export type HttpResponseErrorConfig<TError = unknown> = {
	readonly status: number;
	readonly message: string;
	readonly data: TError;
	readonly response?: unknown;
};

export type ResponseErrorConfig<_TError = unknown> = ApiError;

import type { Fetcher } from "../base-fetch";
import { createFetcher } from "./fetcher";
import { fetcherSettings } from "./singleton";

const fetcher: Fetcher = createFetcher(fetcherSettings);

export type { ApiError, ApiFieldErrorRow } from "../api-error";
export type {
	ExecuteRequest,
	Fetcher,
	HttpResult,
	RequestCredentials,
	RequestMethod,
	RequestOptions,
} from "../base-fetch";
export { requestInitToOptions } from "../request-init";
export {
	getFetcherErrorMessage,
	getUnifiedErrorHttpStatus,
	isResponseError,
	isUnifiedFetcherFailure,
	normalizeFetcherError,
	parseApiErrorEnvelope,
} from "./errorHandling";
export { createFetcher } from "./fetcher";
export { FetcherSettings } from "./settings";
export { defaultFetcherSettingsInput } from "./settings.default";
export { fetcherSettings } from "./singleton";
export type * from "./types";

export default fetcher;

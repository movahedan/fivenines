import type { RequestOptions } from "../base-fetch";
import { baseFetch } from "../base-fetch";
import { defaultFetcherSettingsInput } from "./settings.default";
import { callbacksUtils, requestConfigUtils, runners, settingsUtils } from "./settings.utils";
import type {
	AttachAccessToken,
	FetcherCallbacks,
	FetcherPlainMergeInput,
	FetcherSettingsConfig,
	FetcherSettingsRootApplyInput,
	RefreshCoordination,
} from "./types";

const EMPTY_CONFIG: FetcherSettingsConfig = {};

export type ResolvedFetcherTransport = {
	readonly baseRequestConfig: Partial<RequestOptions> | undefined;
	readonly execute: typeof baseFetch;
	readonly attachAccessToken: AttachAccessToken;
	readonly refreshConfig: {
		readonly refresh: () => Promise<void>;
		readonly shouldRefresh: (options: RequestOptions) => boolean;
		readonly refreshCoordination: RefreshCoordination | undefined;
	};
};

export class FetcherSettings {
	#settingsConfig: FetcherSettingsConfig;
	#callbacks: FetcherCallbacks;
	#mutationGeneration = 0;

	constructor(init?: FetcherPlainMergeInput) {
		this.#settingsConfig = settingsUtils.merge(
			settingsUtils.merge(EMPTY_CONFIG, defaultFetcherSettingsInput.config ?? {}),
			init?.config ?? {},
		);
		this.#callbacks = callbacksUtils.resolve(
			defaultFetcherSettingsInput.callbacks as FetcherCallbacks,
			init?.callbacks,
		);
	}

	get settingsConfig(): Readonly<FetcherSettingsConfig> {
		return this.#settingsConfig;
	}

	get callbacks(): Readonly<FetcherCallbacks> {
		return this.#callbacks;
	}

	get mutationGeneration(): number {
		return this.#mutationGeneration;
	}

	resolveTransport(): ResolvedFetcherTransport {
		const refreshConfig = this.#settingsConfig.refreshConfig;
		return {
			baseRequestConfig: this.#settingsConfig.baseRequestConfig,
			execute: this.#settingsConfig.execute ?? baseFetch,
			attachAccessToken: this.#settingsConfig.attachAccessToken ?? ((options) => options),
			refreshConfig: {
				refresh: refreshConfig?.refresh ?? (async () => undefined),
				shouldRefresh: refreshConfig?.shouldRefresh ?? ((_options: RequestOptions) => false),
				refreshCoordination: refreshConfig?.refreshCoordination,
			},
		};
	}

	async prepareRequest(requestConfig: RequestOptions): Promise<{
		readonly request: RequestOptions;
		readonly options: RequestOptions;
	}> {
		const baseMerged = requestConfigUtils.merge(
			this.#settingsConfig.baseRequestConfig,
			requestConfig,
		);
		const request = await runners.beforeRequest(this.#callbacks.beforeRequest, baseMerged);
		const options = requestConfigUtils.toRequestOptions(request);
		return { request, options };
	}

	async afterError<TError>(request: RequestOptions, error: TError): Promise<never> {
		const handled = await runners.afterError(this.#callbacks.afterError, request, error);
		throw handled;
	}

	merge(scope: FetcherSettings | FetcherPlainMergeInput): FetcherSettings {
		if (scope instanceof FetcherSettings) {
			return FetcherSettings.#fromResolved(
				settingsUtils.merge(this.#settingsConfig, scope.#settingsConfig),
				callbacksUtils.concat(this.#callbacks, scope.#callbacks),
			);
		}
		return FetcherSettings.#fromResolved(
			settingsUtils.merge(this.#settingsConfig, scope.config ?? {}),
			callbacksUtils.concat(this.#callbacks, scope.callbacks),
		);
	}

	setSettings(input: FetcherSettingsRootApplyInput): void {
		const mode = input.mode ?? "merge";
		if (mode === "replace") {
			this.#settingsConfig = settingsUtils.merge(
				settingsUtils.merge(EMPTY_CONFIG, defaultFetcherSettingsInput.config ?? {}),
				input.config ?? {},
			);
			this.#callbacks = callbacksUtils.resolve(
				defaultFetcherSettingsInput.callbacks as FetcherCallbacks,
				input.callbacks,
			);
		} else {
			this.#settingsConfig = settingsUtils.merge(this.#settingsConfig, input.config ?? {});
			this.#callbacks = callbacksUtils.concat(this.#callbacks, input.callbacks);
		}
		this.#mutationGeneration += 1;
	}

	static #fromResolved(
		settingsConfig: FetcherSettingsConfig,
		callbacks: FetcherCallbacks,
	): FetcherSettings {
		const next = new FetcherSettings();
		next.#settingsConfig = settingsConfig;
		next.#callbacks = callbacks;
		return next;
	}
}

import type { Fetcher } from "./base-fetch";
import { createFetcher } from "./fetcher/fetcher";
import type { FetcherSettings } from "./fetcher/settings";

export function createBareFetcher(settings: FetcherSettings): Fetcher {
	const bare = settings.merge({
		config: {
			refreshConfig: {
				refresh: async () => undefined,
				shouldRefresh: () => false,
			},
			attachAccessToken: (options) => options,
		},
	});
	return createFetcher(bare);
}

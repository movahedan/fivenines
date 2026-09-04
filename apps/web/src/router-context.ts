import type { QueryClient } from "@tanstack/react-query";

export interface WebRouterContext {
	readonly queryClient: QueryClient;
}

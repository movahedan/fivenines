import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import type { WebRouterContext } from "./router-context";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60_000,
			},
		},
	});

	const router = createRouter({
		routeTree,
		trailingSlash: "never",
		scrollRestoration: true,
		context: { queryClient } satisfies WebRouterContext,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}

import { buildAnalyticsConfig, initAnalytics, initConsentManager } from "@packages/analytics";

function deferAfterFirstPaint(fn: () => void): void {
	const run = (): void => {
		if (typeof requestIdleCallback === "function") {
			requestIdleCallback(fn, { timeout: 2000 });
		} else {
			setTimeout(fn, 0);
		}
	};
	if (typeof requestAnimationFrame === "function") {
		requestAnimationFrame(() => {
			requestAnimationFrame(run);
		});
	} else {
		run();
	}
}

export function bootstrapWebClient(): void {
	initAnalytics(
		buildAnalyticsConfig({
			isDevelopment: import.meta.env.DEV,
			isProduction: import.meta.env.PROD,
			gtmContainerId: import.meta.env.VITE_GTM_CONTAINER_ID,
		}),
	);

	deferAfterFirstPaint(() => {
		initConsentManager();
		if (!import.meta.env.PROD) {
			return;
		}
		void import("virtual:pwa-register").then(({ registerSW }) => {
			registerSW({ immediate: true });
		});
	});
}

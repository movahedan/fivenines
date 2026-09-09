import type { AnalyticsConfig } from "./env";

let analyticsConfig: AnalyticsConfig | null = null;

export function initAnalytics(config: AnalyticsConfig): void {
	analyticsConfig = config;
}

export function getAnalyticsConfig(): AnalyticsConfig {
	if (!analyticsConfig) {
		throw new Error("@packages/analytics: call initAnalytics() before using analytics APIs");
	}

	return analyticsConfig;
}

/** @internal Reset for unit tests */
export function resetAnalyticsForTests(): void {
	analyticsConfig = null;
}

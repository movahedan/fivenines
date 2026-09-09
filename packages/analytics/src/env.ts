export const ANALYTICS_ENV_VAR_NAMES = ["VITE_GTM_CONTAINER_ID"] as const;

export type AnalyticsConfig = {
	readonly isDevelopment: boolean;
	readonly isProduction: boolean;
	/** GTM container id without the `GTM-` prefix (e.g. `WBJCGDG5`). */
	readonly gtmContainerId: string;
};

export type AnalyticsConfigInput = {
	readonly isDevelopment: boolean;
	readonly isProduction: boolean;
	readonly gtmContainerId?: string;
};

function trimEnv(value: string | undefined): string {
	return (value ?? "").trim();
}

export function buildAnalyticsConfig(input: AnalyticsConfigInput): AnalyticsConfig {
	return {
		isDevelopment: input.isDevelopment,
		isProduction: input.isProduction,
		gtmContainerId: trimEnv(input.gtmContainerId),
	};
}

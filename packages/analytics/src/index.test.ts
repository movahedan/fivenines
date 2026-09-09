import { beforeEach, describe, expect, it } from "bun:test";

import { initAnalytics, resetAnalyticsForTests } from "./configure";
import { buildAnalyticsConfig } from "./env";
import * as analytics from "./index";

describe("analytics index", () => {
	beforeEach(() => {
		resetAnalyticsForTests();
		initAnalytics(
			buildAnalyticsConfig({
				isDevelopment: true,
				isProduction: false,
				gtmContainerId: "",
			}),
		);
	});

	it("re-exports the public analytics API", () => {
		expect(analytics.initAnalytics).toBeTypeOf("function");
		expect(analytics.initConsentManager).toBeTypeOf("function");
		expect(analytics.openCookiePreferences).toBeTypeOf("function");
		expect(analytics.buildAnalyticsConfig).toBeTypeOf("function");
		expect(analytics.ANALYTICS_ENV_VAR_NAMES).toEqual(["VITE_GTM_CONTAINER_ID"]);
	});
});

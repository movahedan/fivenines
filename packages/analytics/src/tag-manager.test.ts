import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { initAnalytics, resetAnalyticsForTests } from "./configure";
import { buildAnalyticsConfig } from "./env";
import { resetTagManagerForTests, setupTagManager } from "./tag-manager";

const testGtmContainerId = "TESTGTM01";

describe("setupTagManager", () => {
	beforeEach(() => {
		resetAnalyticsForTests();
		resetTagManagerForTests();
		document.getElementById("_gtm_script_tag")?.remove();
		for (const node of [...document.body.querySelectorAll("noscript")]) {
			node.remove();
		}
	});

	afterEach(() => {
		resetAnalyticsForTests();
		resetTagManagerForTests();
		document.getElementById("_gtm_script_tag")?.remove();
		for (const node of [...document.body.querySelectorAll("noscript")]) {
			node.remove();
		}
	});

	it("does not inject GTM in development", () => {
		initAnalytics(
			buildAnalyticsConfig({
				isDevelopment: true,
				isProduction: false,
				gtmContainerId: testGtmContainerId,
			}),
		);

		setupTagManager();

		expect(document.getElementById("_gtm_script_tag")).toBeNull();
	});

	it("injects GTM once in production", () => {
		initAnalytics(
			buildAnalyticsConfig({
				isDevelopment: false,
				isProduction: true,
				gtmContainerId: testGtmContainerId,
			}),
		);

		setupTagManager();
		setupTagManager();

		expect(document.querySelectorAll("#_gtm_script_tag")).toHaveLength(1);
	});

	it("embeds the configured GTM container id", () => {
		initAnalytics(
			buildAnalyticsConfig({
				isDevelopment: false,
				isProduction: true,
				gtmContainerId: testGtmContainerId,
			}),
		);

		setupTagManager();

		expect(document.getElementById("_gtm_script_tag")?.innerHTML).toContain(
			`GTM-${testGtmContainerId}`,
		);
	});

	it("skips GTM when the container id is empty", () => {
		initAnalytics(
			buildAnalyticsConfig({
				isDevelopment: false,
				isProduction: true,
				gtmContainerId: "",
			}),
		);

		setupTagManager();

		expect(document.getElementById("_gtm_script_tag")).toBeNull();
	});
});

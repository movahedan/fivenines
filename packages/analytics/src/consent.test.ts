import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { initAnalytics, resetAnalyticsForTests } from "./configure";
import {
	hasAnalyticsConsent,
	hasMarketingConsent,
	initConsentManager,
	openCookiePreferences,
} from "./consent";
import { buildAnalyticsConfig } from "./env";
import { resetTagManagerForTests } from "./tag-manager";

const initMock = mock(() => undefined);
const hideCookieIcon = mock(() => undefined);
const toggleModal = mock(() => undefined);

const getConsentChoice = mock((id: string) => {
	if (id === "analytics") return true;
	if (id === "marketing") return false;
	return null;
});

describe("consent", () => {
	beforeEach(() => {
		initMock.mockClear();
		hideCookieIcon.mockClear();
		toggleModal.mockClear();
		getConsentChoice.mockClear();
		getConsentChoice.mockImplementation((id: string) => {
			if (id === "analytics") return true;
			if (id === "marketing") return false;
			return null;
		});
		resetAnalyticsForTests();
		resetTagManagerForTests();
		document.getElementById("_gtm_script_tag")?.remove();
		window.silktideConsentManager = {
			init: initMock,
			update: () => undefined,
			resetConsent: () => undefined,
			getInstance: () => ({
				getConsentChoice,
				getAcceptedConsents: () => ({}),
				toggleModal,
				showCookieIcon: () => undefined,
				hideCookieIcon,
			}),
		};
	});

	afterEach(() => {
		Reflect.deleteProperty(window, "silktideConsentManager");
		resetAnalyticsForTests();
		resetTagManagerForTests();
		document.getElementById("_gtm_script_tag")?.remove();
	});

	it("initializes Silktide with essential, analytics, and marketing types", () => {
		initConsentManager();

		expect(initMock).toHaveBeenCalledTimes(1);
		const firstCall = (initMock.mock.calls as unknown as ReadonlyArray<readonly [unknown]>)[0];
		const config = firstCall?.[0] as {
			consentTypes: Array<{ id: string }>;
			prompt?: { position?: string };
			icon?: unknown;
		};
		expect(config.consentTypes.map((type) => type.id)).toEqual([
			"essential",
			"analytics",
			"marketing",
		]);
		expect(config.prompt?.position).toBe("bottomCenter");
		expect(config.icon).toBeUndefined();
	});

	it("hides the floating cookie icon after init", () => {
		initConsentManager();
		expect(hideCookieIcon).toHaveBeenCalled();
	});

	it("loads GTM when analytics consent is accepted", () => {
		initAnalytics(
			buildAnalyticsConfig({
				isDevelopment: false,
				isProduction: true,
				gtmContainerId: "TESTGTM01",
			}),
		);
		initConsentManager();

		const firstCall = (initMock.mock.calls as unknown as ReadonlyArray<readonly [unknown]>)[0];
		const config = firstCall?.[0] as {
			consentTypes: Array<{ id: string; onAccept?: () => void }>;
		};
		const analytics = config.consentTypes.find((type) => type.id === "analytics");
		analytics?.onAccept?.();

		expect(document.getElementById("_gtm_script_tag")?.innerHTML).toContain("GTM-TESTGTM01");
	});

	it("reads consent choices from the Silktide instance", () => {
		expect(hasAnalyticsConsent()).toBe(true);
		expect(hasMarketingConsent()).toBe(false);
	});

	it("opens the preferences modal when available", () => {
		openCookiePreferences();
		expect(toggleModal).toHaveBeenCalledWith(true);
	});
});

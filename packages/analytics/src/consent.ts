import "./silktide-consent-manager.d.ts";

import type {
	SilktideConsentManagerConfig,
	SilktideConsentManagerInstance,
} from "./silktide-consent-manager.types";
import { setupTagManager } from "./tag-manager";

const silktideConfig: SilktideConsentManagerConfig = {
	backdrop: {
		show: true,
	},
	prompt: {
		position: "bottomCenter",
	},
	consentTypes: [
		{
			id: "essential",
			label: "Essential",
			description:
				"<p>These cookies are necessary for the website to function properly and cannot be switched off. They help with sign in, security, theme preferences, and the consent banner itself.</p>",
			required: true,
		},
		{
			id: "analytics",
			label: "Analytics",
			description:
				"<p>These cookies help us improve the site by tracking which pages are most popular and how visitors move around the site.</p>",
			gtag: ["analytics_storage", "functionality_storage"],
			onAccept: () => {
				setupTagManager();
			},
		},
		{
			id: "marketing",
			label: "Marketing",
			description:
				"<p>These cookies are used by us and our advertising partners to show you relevant ads on this site and elsewhere, and to measure how those campaigns perform.</p>",
			gtag: ["ad_storage", "ad_user_data", "ad_personalization"],
		},
	],
	text: {
		prompt: {
			description:
				'<p>We use cookies on our site to enhance your user experience, provide personalized content, and analyze our traffic. Read our <a href="/cookie-policy">Cookie Policy</a>.</p>',
			acceptAllButtonText: "Accept all",
			acceptAllButtonAccessibleLabel: "Accept all cookies",
			rejectNonEssentialButtonText: "Reject non-essential",
			rejectNonEssentialButtonAccessibleLabel: "Reject all non-essential cookies",
			preferencesButtonText: "Preferences",
			preferencesButtonAccessibleLabel: "Toggle preferences",
		},
		preferences: {
			title: "Customize your cookie preferences",
			description:
				'<p>We respect your right to privacy. You can choose not to allow some types of cookies. Your cookie preferences will apply across our website. Read our <a href="/cookie-policy">Cookie Policy</a>.</p>',
			saveButtonText: "Save and close",
			saveButtonAccessibleLabel: "Save your cookie preferences",
			creditLinkText: "Get this banner for free",
			creditLinkAccessibleLabel: "Get this banner for free",
		},
	},
};

function getConsentManagerInstance(): SilktideConsentManagerInstance | null {
	if (globalThis.window === undefined) return null;
	if (!globalThis.window.silktideConsentManager) return null;

	return globalThis.window.silktideConsentManager.getInstance();
}

export function initConsentManager(): void {
	if (globalThis.window === undefined) return;
	if (!globalThis.window.silktideConsentManager) return;

	globalThis.window.silktideConsentManager.init(silktideConfig);
	getConsentManagerInstance()?.hideCookieIcon?.();
}

export function hasAnalyticsConsent(): boolean {
	return getConsentManagerInstance()?.getConsentChoice("analytics") === true;
}

export function hasMarketingConsent(): boolean {
	return getConsentManagerInstance()?.getConsentChoice("marketing") === true;
}

export function openCookiePreferences(): void {
	getConsentManagerInstance()?.toggleModal?.(true);
}

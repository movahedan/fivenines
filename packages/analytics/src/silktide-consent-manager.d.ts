import {
	type SilktideConsentManagerConfig,
	type SilktideConsentManagerInstance,
} from "./silktide-consent-manager.types";

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		silktideConsentManager: {
			init: (config: SilktideConsentManagerConfig) => void;
			update: (config: Partial<SilktideConsentManagerConfig>) => void;
			resetConsent: () => void;
			getInstance: () => SilktideConsentManagerInstance | null;
		};
	}
}

export type SilktideConsentTypeId = "essential" | "analytics" | "marketing";

export type SilktideConsentTypeConfig = {
	id: SilktideConsentTypeId;
	label: string;
	description: string;
	required?: boolean;
	defaultValue?: boolean;
	gtag?: string | string[];
	scripts?: Array<{
		url: string;
		load?: "async" | "defer";
		type?: string;
		crossorigin?: string;
		integrity?: string;
	}>;
	onAccept?: () => void;
	onReject?: () => void;
};

export type SilktideConsentManagerConfig = {
	consentTypes: SilktideConsentTypeConfig[];
	eventName?: string;
	namespace?: string;
	autoShow?: boolean;
	debug?: boolean;
	backdrop?: { show?: boolean };
	icon?: { position?: "bottomLeft" | "bottomRight" };
	prompt?: {
		position?: "center" | "bottomLeft" | "bottomCenter" | "bottomRight";
	};
	text?: {
		prompt?: {
			description?: string;
			acceptAllButtonText?: string;
			acceptAllButtonAccessibleLabel?: string;
			rejectNonEssentialButtonText?: string;
			rejectNonEssentialButtonAccessibleLabel?: string;
			preferencesButtonText?: string;
			preferencesButtonAccessibleLabel?: string;
		};
		preferences?: {
			title?: string;
			description?: string;
			saveButtonText?: string;
			saveButtonAccessibleLabel?: string;
			creditLinkText?: string;
			creditLinkAccessibleLabel?: string;
		};
	};
	onAcceptAll?: () => void;
	onRejectAll?: () => void;
	onPreferencesOpen?: () => void;
	onPreferencesClose?: () => void;
};

export type SilktideConsentManagerInstance = {
	getConsentChoice: (typeId: string) => boolean | null;
	getAcceptedConsents: () => Record<string, boolean | null>;
	toggleModal?: (show: boolean) => void;
	showCookieIcon?: () => void;
	hideCookieIcon?: () => void;
};

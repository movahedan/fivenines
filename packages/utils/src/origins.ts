const DEFAULT_AUTH_ORIGIN = "http://auth.fivenines.com:3007";
const DEFAULT_APP_ORIGIN = "http://play.fivenines.com:3001";

function parseHttpOrigin(raw: string | undefined): string | null {
	if (raw == null) {
		return null;
	}

	const trimmed = raw.trim();
	if (trimmed.length === 0) {
		return null;
	}
	if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
		return null;
	}

	return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getAuthOrigin(authUrl?: string): string {
	return parseHttpOrigin(authUrl) ?? DEFAULT_AUTH_ORIGIN;
}

export function getAppOrigin(appOrigin?: string): string {
	const fromEnv = parseHttpOrigin(appOrigin);
	if (fromEnv) {
		return fromEnv;
	}
	if (typeof globalThis.window !== "undefined") {
		const origin = globalThis.window.location?.origin;
		if (typeof origin === "string" && origin.length > 0) {
			return origin;
		}
	}
	return DEFAULT_APP_ORIGIN;
}

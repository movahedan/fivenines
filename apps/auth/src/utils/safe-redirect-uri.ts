const REDIRECT_MAX_LENGTH = 512;

export function safeRedirectUri(
	raw: string | undefined | null,
	allowedOrigins: readonly string[],
): string | null {
	if (raw == null || raw.length === 0 || raw.length > REDIRECT_MAX_LENGTH) {
		return null;
	}

	let decoded = raw;
	try {
		decoded = decodeURIComponent(raw);
	} catch {
		return null;
	}

	if (decoded.length === 0 || decoded.length > REDIRECT_MAX_LENGTH) {
		return null;
	}

	let parsed: URL;
	try {
		parsed = new URL(decoded);
	} catch {
		return null;
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return null;
	}
	if (parsed.username.length > 0 || parsed.password.length > 0) {
		return null;
	}
	if (parsed.pathname.length === 0 || parsed.pathname[0] !== "/") {
		return null;
	}
	if (parsed.pathname.startsWith("//")) {
		return null;
	}

	const allowed = new Set(allowedOrigins);
	if (!allowed.has(parsed.origin)) {
		return null;
	}

	return parsed.toString();
}

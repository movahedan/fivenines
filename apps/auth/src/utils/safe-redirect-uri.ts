export function safeRedirectUri(
	raw: string | undefined | null,
	allowedOrigins: readonly string[],
): string | null {
	if (raw == null || raw.length === 0) {
		return null;
	}

	try {
		const url = new URL(raw);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}
		if (!allowedOrigins.includes(url.origin)) {
			return null;
		}
		return url.toString();
	} catch {
		return null;
	}
}

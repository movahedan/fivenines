export type CookieHeaders = Headers | Record<string, string | string[] | undefined> | string;

function documentCookieHeader(): string | null {
	if (typeof document === "undefined") {
		return null;
	}
	return document.cookie;
}

function headerValue(raw: string | string[] | undefined): string | null {
	if (raw == null) {
		return null;
	}
	if (Array.isArray(raw)) {
		return raw.join("; ");
	}
	return raw;
}

function cookieHeader(headers?: CookieHeaders): string | null {
	if (headers === undefined) {
		return documentCookieHeader();
	}
	if (typeof headers === "string") {
		return headers;
	}
	if (typeof Headers !== "undefined" && headers instanceof Headers) {
		return headers.get("cookie");
	}
	const record = headers as Record<string, string | string[] | undefined>;
	return headerValue(record.cookie ?? record.Cookie);
}

function decodeCookieValue(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export const cookies = {
	get(name: string, headers?: CookieHeaders): string | null {
		const header = cookieHeader(headers);
		if (header == null || header.length === 0 || name.length === 0) {
			return null;
		}

		const prefix = `${name}=`;
		for (const part of header.split(";")) {
			const trimmed = part.trim();
			if (trimmed.startsWith(prefix)) {
				return decodeCookieValue(trimmed.slice(prefix.length));
			}
		}
		return null;
	},
};

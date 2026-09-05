export type CookieHeaders = Headers | Record<string, string | string[] | undefined> | string;

export type CookieFlags = {
	readonly path?: string;
	readonly maxAge?: number;
	readonly domain?: string;
	readonly secure?: boolean;
	readonly httpOnly?: boolean;
	readonly sameSite?: "Strict" | "Lax" | "None";
};

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

function serializeCookie(name: string, value: string, flags: CookieFlags = {}): string {
	const parts = [`${name}=${encodeURIComponent(value)}`];
	const path = flags.path ?? "/";
	parts.push(`Path=${path}`);
	if (flags.maxAge !== undefined) {
		parts.push(`Max-Age=${flags.maxAge}`);
	}
	if (flags.domain !== undefined && flags.domain.length > 0) {
		parts.push(`Domain=${flags.domain}`);
	}
	if (flags.sameSite !== undefined) {
		parts.push(`SameSite=${flags.sameSite}`);
	}
	if (flags.httpOnly === true) {
		parts.push("HttpOnly");
	}
	if (flags.secure === true) {
		parts.push("Secure");
	}
	return parts.join("; ");
}

function writeDocumentCookie(line: string): void {
	if (typeof document === "undefined") {
		return;
	}
	document.cookie = line;
}

function getCookie(name: string, headers?: CookieHeaders): string | null {
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
}

function setCookie(name: string, value: string, flags?: CookieFlags): undefined;
function setCookie(
	name: string,
	value: string,
	flags: CookieFlags | undefined,
	headers: Headers,
): Headers;
function setCookie(
	name: string,
	value: string,
	flags?: CookieFlags,
	headers?: Headers,
): Headers | undefined {
	const line = serializeCookie(name, value, flags);
	if (headers !== undefined) {
		const next = new Headers(headers);
		next.append("Set-Cookie", line);
		return next;
	}
	writeDocumentCookie(line);
	return undefined;
}

function deleteCookie(name: string, flags?: CookieFlags): undefined;
function deleteCookie(name: string, flags: CookieFlags | undefined, headers: Headers): Headers;
function deleteCookie(name: string, flags?: CookieFlags, headers?: Headers): Headers | undefined {
	if (headers !== undefined) {
		return setCookie(name, "", { ...flags, maxAge: 0 }, headers);
	}
	setCookie(name, "", { ...flags, maxAge: 0 });
	return undefined;
}

export const cookies = {
	get: getCookie,
	set: setCookie,
	delete: deleteCookie,
};

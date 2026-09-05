const NEXT_MAX_LENGTH = 256;

export function safeNextPath(raw: string | undefined | null, fallback = "/"): string {
	if (raw == null || raw.length === 0 || raw.length > NEXT_MAX_LENGTH) {
		return fallback;
	}

	let decoded = raw;
	try {
		decoded = decodeURIComponent(raw);
	} catch {
		return fallback;
	}

	if (decoded.length === 0 || decoded.length > NEXT_MAX_LENGTH) {
		return fallback;
	}
	if (decoded[0] !== "/") {
		return fallback;
	}
	if (decoded[1] === "/") {
		return fallback;
	}

	for (let i = 0; i < decoded.length; i++) {
		const char = decoded[i];
		if (char === "\\" || char === "\0" || char === "\n" || char === "\r") {
			return fallback;
		}
	}

	if (decoded.includes("://")) {
		return fallback;
	}

	return decoded;
}

export function nextFromRequest(req: Request, formNext?: string): string {
	const fromForm = safeNextPath(formNext, "");
	if (fromForm.length > 0) {
		return fromForm;
	}
	return safeNextPath(new URL(req.url).searchParams.get("next"));
}

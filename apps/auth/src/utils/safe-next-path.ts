const NEXT_BASE = "https://auth.local";

export function safeNextPath(raw: string | undefined | null, fallback = "/"): string {
	if (raw == null || raw.length === 0) {
		return fallback;
	}

	try {
		const url = new URL(raw, NEXT_BASE);
		if (url.origin !== new URL(NEXT_BASE).origin) {
			return fallback;
		}
		const path = `${url.pathname}${url.search}`;
		if (!path.startsWith("/") || path.startsWith("//")) {
			return fallback;
		}
		return path;
	} catch {
		return fallback;
	}
}

export function nextFromRequest(req: Request, formNext?: string): string {
	const fromForm = safeNextPath(formNext, "");
	if (fromForm.length > 0) {
		return fromForm;
	}
	return safeNextPath(new URL(req.url).searchParams.get("next"));
}

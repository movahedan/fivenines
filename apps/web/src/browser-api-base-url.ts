export function getBrowserApiBaseUrl(): string {
	const raw = import.meta.env.VITE_NESTJS_API_URL?.trim();
	if (raw && /^https?:\/\//i.test(raw)) {
		return raw.replace(/\/$/, "");
	}
	return "http://localhost:3006";
}

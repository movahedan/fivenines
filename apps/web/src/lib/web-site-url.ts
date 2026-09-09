const DEFAULT_WEB_ORIGIN = "http://play.fivenines.com:3000";

function readWebOriginEnv(): string | undefined {
	try {
		const fromVite = import.meta.env?.VITE_APP_ORIGIN;
		if (fromVite) {
			return fromVite;
		}
	} catch {
		// bun prerender has no Vite env object
	}
	if (typeof process !== "undefined") {
		return process.env.VITE_APP_ORIGIN;
	}
	return undefined;
}

export function getWebSiteOrigin(): string {
	const raw = (readWebOriginEnv() ?? DEFAULT_WEB_ORIGIN).replace(/\/$/, "");
	return raw || DEFAULT_WEB_ORIGIN;
}

export function getWebMetadataBase(): URL {
	return new URL(`${getWebSiteOrigin()}/`);
}

export function absoluteWebUrl(path: string): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return new URL(normalized, getWebMetadataBase()).href;
}

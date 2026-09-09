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

function getWebSiteOrigin(): string {
	const raw = (readWebOriginEnv() ?? DEFAULT_WEB_ORIGIN).replace(/\/$/, "");
	return raw || DEFAULT_WEB_ORIGIN;
}

function absoluteWebUrl(path: string): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return new URL(normalized, `${getWebSiteOrigin()}/`).href;
}

export function pageHead(input: {
	readonly title: string;
	readonly description: string;
	readonly path: string;
}): { meta: Array<Record<string, string>> } {
	return {
		meta: [
			{ title: input.title },
			{ name: "description", content: input.description },
			{ property: "og:title", content: input.title },
			{ property: "og:description", content: input.description },
			{ property: "og:image", content: absoluteWebUrl("/og.svg") },
			{ property: "og:url", content: absoluteWebUrl(input.path) },
			{ name: "twitter:card", content: "summary_large_image" },
		],
	};
}

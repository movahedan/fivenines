import { absoluteWebUrl } from "../lib/web-site-url";

export function siteHead(input: {
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

export const WEB_PRERENDER_PATHS = [
	"/",
	"/about",
	"/privacy",
	"/terms",
	"/cookie-policy",
	"/contact",
] as const;

export type WebPrerenderPath = (typeof WEB_PRERENDER_PATHS)[number];

export function prerenderPathToDistRelative(path: WebPrerenderPath): string {
	if (path === "/") {
		return "index.html";
	}
	const segments = path.replace(/^\//, "");
	return `${segments}/index.html`;
}

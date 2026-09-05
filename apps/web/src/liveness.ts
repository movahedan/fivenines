export function processStatusBody(): { readonly ok: true; readonly timestamp: string } {
	return { ok: true, timestamp: new Date().toISOString() };
}

export function isLivenessPath(pathname: string): boolean {
	return pathname === "/" || pathname === "/status";
}

export function acceptIncludesJson(acceptHeader: string | undefined): boolean {
	return typeof acceptHeader === "string" && acceptHeader.includes("application/json");
}

import { createHash, randomBytes } from "node:crypto";

import type { CookieFlags } from "@packages/utils/cookies";

import { authConfig } from "../../config";

export function createCsrfToken(): string {
	return randomBytes(32).toString("hex");
}

export function validateCsrf(
	cookieToken: string | undefined,
	formToken: string | undefined,
): boolean {
	if (!cookieToken || !formToken) {
		return false;
	}
	const a = createHash("sha256").update(cookieToken).digest("hex");
	const b = createHash("sha256").update(formToken).digest("hex");
	return a === b;
}

export function csrfCookieFlags(maxAgeSeconds: number): CookieFlags {
	return {
		path: "/",
		maxAge: maxAgeSeconds,
		sameSite: "Lax",
		httpOnly: false,
		secure: authConfig.cookieSecure,
	};
}

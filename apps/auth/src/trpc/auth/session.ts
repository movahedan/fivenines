import { createHash, randomBytes } from "node:crypto";

import { authConfig } from "../../config";
import { prisma } from "../../db";

const REFRESH_TTL_MS = authConfig.refreshTtlDays * 24 * 60 * 60 * 1000;

export function hashRefreshToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function createRefreshToken(): string {
	return randomBytes(48).toString("base64url");
}

type CookieFlags = {
	readonly httpOnly: boolean;
	readonly maxAgeSeconds: number;
};

function cookieHeader(name: string, value: string, flags: CookieFlags): string {
	const parts = [
		`${name}=${encodeURIComponent(value)}`,
		"Path=/",
		`Max-Age=${flags.maxAgeSeconds}`,
		"SameSite=Strict",
	];
	if (flags.httpOnly) {
		parts.push("HttpOnly");
	}
	const domain = authConfig.cookieDomain.trim();
	if (domain.length > 0) {
		parts.push(`Domain=${domain}`);
	}
	if (authConfig.cookieSecure) {
		parts.push("Secure");
	}
	return parts.join("; ");
}

export function sessionCookieHeader(sessionId: string, maxAgeSeconds: number): string {
	return cookieHeader(authConfig.cookieSession, sessionId, { httpOnly: true, maxAgeSeconds });
}

export function refreshCookieHeader(refreshToken: string, maxAgeSeconds: number): string {
	return cookieHeader(authConfig.cookieRefresh, refreshToken, { httpOnly: true, maxAgeSeconds });
}

export function accessCookieHeader(accessToken: string, maxAgeSeconds: number): string {
	return cookieHeader(authConfig.cookieAccess, accessToken, { httpOnly: true, maxAgeSeconds });
}

export function loggedInCookieHeader(maxAgeSeconds: number): string {
	return cookieHeader(authConfig.cookieLoggedIn, "1", { httpOnly: false, maxAgeSeconds });
}

export function clearCookieHeader(name: string): string {
	const parts = [`${name}=`, "Path=/", "Max-Age=0", "HttpOnly", "SameSite=Strict"];
	const domain = authConfig.cookieDomain.trim();
	if (domain.length > 0) {
		parts.push(`Domain=${domain}`);
	}
	if (authConfig.cookieSecure) {
		parts.push("Secure");
	}
	return parts.join("; ");
}

export function clearLoggedInCookieHeader(): string {
	const parts = [`${authConfig.cookieLoggedIn}=`, "Path=/", "Max-Age=0", "SameSite=Strict"];
	const domain = authConfig.cookieDomain.trim();
	if (domain.length > 0) {
		parts.push(`Domain=${domain}`);
	}
	if (authConfig.cookieSecure) {
		parts.push("Secure");
	}
	return parts.join("; ");
}

export async function createSession(input: {
	userId: string;
	activeTenantId: string;
}): Promise<{ sessionId: string; refreshToken: string }> {
	const refreshToken = createRefreshToken();
	const session = await prisma.session.create({
		data: {
			userId: input.userId,
			activeTenantId: input.activeTenantId,
			refreshTokenHash: hashRefreshToken(refreshToken),
			expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
		},
	});
	return { sessionId: session.id, refreshToken };
}

export async function rotateSessionRefresh(
	sessionId: string,
): Promise<{ refreshToken: string } | null> {
	const session = await prisma.session.findFirst({
		where: { id: sessionId, revokedAt: null, expiresAt: { gt: new Date() } },
	});
	if (!session) {
		return null;
	}
	const refreshToken = createRefreshToken();
	await prisma.session.update({
		where: { id: sessionId },
		data: {
			refreshTokenHash: hashRefreshToken(refreshToken),
			expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
		},
	});
	return { refreshToken };
}

export async function revokeSession(sessionId: string): Promise<void> {
	await prisma.session.update({
		where: { id: sessionId },
		data: { revokedAt: new Date() },
	});
}

export function parseCookies(header: string | null): Record<string, string> {
	if (!header) {
		return {};
	}
	const out: Record<string, string> = {};
	for (const part of header.split(";")) {
		const [rawKey, ...rest] = part.trim().split("=");
		if (!rawKey) {
			continue;
		}
		out[rawKey] = decodeURIComponent(rest.join("="));
	}
	return out;
}

export async function resolveSessionFromCookies(cookieHeader: string | null) {
	const cookies = parseCookies(cookieHeader);
	const sessionId = cookies[authConfig.cookieSession];
	const refreshToken = cookies[authConfig.cookieRefresh];
	if (!sessionId || !refreshToken) {
		return null;
	}
	const session = await prisma.session.findFirst({
		where: {
			id: sessionId,
			revokedAt: null,
			expiresAt: { gt: new Date() },
			refreshTokenHash: hashRefreshToken(refreshToken),
		},
		include: {
			user: {
				include: {
					memberships: { include: { tenant: true } },
				},
			},
		},
	});
	return session;
}

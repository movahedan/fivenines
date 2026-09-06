import { createHash, randomBytes } from "node:crypto";

import { type CookieFlags, cookies } from "@packages/shared/cookies";

import { authConfig } from "../../config";
import { prisma } from "../../db";
import { csrfCookieFlags } from "./csrf";

const REFRESH_TTL_MS = authConfig.refreshTtlDays * 24 * 60 * 60 * 1000;

export function hashRefreshToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function createRefreshToken(): string {
	return randomBytes(48).toString("base64url");
}

export function authCookieFlags(maxAgeSeconds: number, httpOnly: boolean): CookieFlags {
	const domain = authConfig.cookieDomain.trim();
	return {
		path: "/",
		maxAge: maxAgeSeconds,
		sameSite: "Strict",
		httpOnly,
		secure: authConfig.cookieSecure,
		domain: domain.length > 0 ? domain : undefined,
	};
}

export function appendAuthCookie(
	headers: Headers,
	name: string,
	value: string,
	flags: CookieFlags,
): Headers {
	return cookies.set(name, value, flags, headers) ?? headers;
}

export function clearAuthCookie(headers: Headers, name: string, httpOnly: boolean): Headers {
	return cookies.delete(name, authCookieFlags(0, httpOnly), headers) ?? headers;
}

export function appendLoginSessionCookies(
	headers: Headers,
	result: { sessionId: string; refreshToken: string; accessToken: string },
): Headers {
	const persistentSeconds = authConfig.refreshTtlDays * 24 * 60 * 60;
	let next = appendAuthCookie(
		headers,
		authConfig.cookieSession,
		result.sessionId,
		authCookieFlags(persistentSeconds, true),
	);
	next = appendAuthCookie(
		next,
		authConfig.cookieRefresh,
		result.refreshToken,
		authCookieFlags(persistentSeconds, true),
	);
	next = appendAuthCookie(
		next,
		authConfig.cookieAccess,
		result.accessToken,
		authCookieFlags(authConfig.accessTtlSeconds, true),
	);
	return appendAuthCookie(
		next,
		authConfig.cookieLoggedIn,
		"1",
		authCookieFlags(persistentSeconds, false),
	);
}

export function appendClearedAuthCookies(headers: Headers): Headers {
	let next = clearAuthCookie(headers, authConfig.cookieSession, true);
	next = clearAuthCookie(next, authConfig.cookieRefresh, true);
	next = clearAuthCookie(next, authConfig.cookieAccess, true);
	next = cookies.delete(authConfig.cookieCsrf, csrfCookieFlags(0), next) ?? next;
	return clearAuthCookie(next, authConfig.cookieLoggedIn, false);
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

export async function resolveSessionFromCookies(cookieHeader: string | null) {
	const sessionId = cookies.get(authConfig.cookieSession, cookieHeader ?? undefined);
	const refreshToken = cookies.get(authConfig.cookieRefresh, cookieHeader ?? undefined);
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

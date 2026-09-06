import type { TenantRole } from "@packages/auth/contract";
import { cookies } from "@packages/shared/cookies";

import { authConfig } from "../../config";
import { prisma } from "../../db";
import { humanAccessTokenForMembership } from "./access-token";
import {
	appendAuthCookie,
	authCookieFlags,
	hashRefreshToken,
	resolveSessionFromCookies,
	rotateSessionRefresh,
} from "./session";

const GENERIC_ERROR = { error: "invalid_grant" as const };

async function accessTokenFromActiveMembership(session: {
	userId: string;
	activeTenantId: string;
	user: {
		memberships: Array<{ tenantId: string; role: string }>;
	};
}): Promise<string | null> {
	const membership = session.user.memberships.find((m) => m.tenantId === session.activeTenantId);
	if (!membership) {
		return null;
	}
	return humanAccessTokenForMembership({
		userId: session.userId,
		tenantId: session.activeTenantId,
		role: membership.role as TenantRole,
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

async function sessionCredentialsFromRequest(
	req: Request,
): Promise<{ sessionId: string; refreshToken: string } | null> {
	const sessionId = cookies.get(authConfig.cookieSession, req.headers);
	const refreshToken = cookies.get(authConfig.cookieRefresh, req.headers);
	if (sessionId && refreshToken) {
		return { sessionId, refreshToken };
	}

	const contentType = req.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		return null;
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return null;
	}
	if (
		!isRecord(body) ||
		typeof body.session_id !== "string" ||
		typeof body.refresh_token !== "string" ||
		body.session_id.length === 0 ||
		body.refresh_token.length === 0
	) {
		return null;
	}
	return { sessionId: body.session_id, refreshToken: body.refresh_token };
}

export async function handleRefreshRequest(req: Request): Promise<Response> {
	const credentials = await sessionCredentialsFromRequest(req);
	if (!credentials) {
		return Response.json(GENERIC_ERROR, { status: 401 });
	}
	const { sessionId, refreshToken } = credentials;

	const session = await prisma.session.findFirst({
		where: {
			id: sessionId,
			revokedAt: null,
			expiresAt: { gt: new Date() },
			refreshTokenHash: hashRefreshToken(refreshToken),
		},
		include: {
			user: { include: { memberships: true } },
		},
	});

	if (!session?.activeTenantId) {
		return Response.json(GENERIC_ERROR, { status: 401 });
	}

	const accessToken = await accessTokenFromActiveMembership({
		userId: session.userId,
		activeTenantId: session.activeTenantId,
		user: session.user,
	});
	if (!accessToken) {
		return Response.json(GENERIC_ERROR, { status: 401 });
	}

	const rotated = await rotateSessionRefresh(session.id);
	if (!rotated) {
		return Response.json(GENERIC_ERROR, { status: 401 });
	}

	const maxAge = authConfig.refreshTtlDays * 24 * 60 * 60;
	let headers = new Headers({ "content-type": "application/json" });
	headers = appendAuthCookie(
		headers,
		authConfig.cookieRefresh,
		rotated.refreshToken,
		authCookieFlags(maxAge, true),
	);
	headers = appendAuthCookie(
		headers,
		authConfig.cookieAccess,
		accessToken,
		authCookieFlags(authConfig.accessTtlSeconds, true),
	);
	headers = appendAuthCookie(
		headers,
		authConfig.cookieLoggedIn,
		"1",
		authCookieFlags(maxAge, false),
	);

	return Response.json({ ok: true }, { headers });
}

export async function refreshFromSessionCookie(req: Request) {
	const session = await resolveSessionFromCookies(req.headers.get("cookie"));
	if (!session?.activeTenantId) {
		return null;
	}
	const accessToken = await accessTokenFromActiveMembership({
		userId: session.userId,
		activeTenantId: session.activeTenantId,
		user: session.user,
	});
	if (!accessToken) {
		return null;
	}
	const membership = session.user.memberships.find((m) => m.tenantId === session.activeTenantId);
	return { accessToken, session, membership };
}

import { authUserFromMe, fetchAuthMe, loginWithPassword, logoutSession } from "./client";
import {
	type AuthLoginResult,
	type AuthSessionOptions,
	type AuthUser,
	type ResolvedAuthSessionOptions,
	resolveAuthSessionOptions,
} from "./types";

type AuthSessionState = {
	accessToken: string | null;
	user: AuthUser | null;
	expiresAt: number | null;
};

export type AuthSessionStatus = "idle" | "restoring" | "ready";

/** Immutable view for `useSyncExternalStore` — must be referentially stable between updates. */
export type AuthSessionSnapshot = {
	readonly user: AuthUser | null;
	readonly isAuthenticated: boolean;
	readonly status: AuthSessionStatus;
};

const IDLE_SNAPSHOT: AuthSessionSnapshot = {
	user: null,
	isAuthenticated: false,
	status: "idle",
};

const RESTORING_SNAPSHOT: AuthSessionSnapshot = {
	user: null,
	isAuthenticated: false,
	status: "restoring",
};

const READY_EMPTY_SNAPSHOT: AuthSessionSnapshot = {
	user: null,
	isAuthenticated: false,
	status: "ready",
};

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
	if (typeof document === "undefined") {
		return;
	}
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string): void {
	if (typeof document === "undefined") {
		return;
	}
	document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function getCookie(name: string): string | null {
	if (typeof document === "undefined") {
		return null;
	}
	const prefix = `${name}=`;
	for (const part of document.cookie.split(";")) {
		const trimmed = part.trim();
		if (trimmed.startsWith(prefix)) {
			return decodeURIComponent(trimmed.slice(prefix.length));
		}
	}
	return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseAuthUser(value: unknown): AuthUser | null {
	if (!isRecord(value)) {
		return null;
	}
	if (
		typeof value.id !== "string" ||
		typeof value.email !== "string" ||
		typeof value.tenantId !== "string" ||
		typeof value.role !== "string"
	) {
		return null;
	}
	return {
		id: value.id,
		email: value.email,
		tenantId: value.tenantId,
		role: value.role,
	};
}

function snapshotFromState(
	state: AuthSessionState,
	status: AuthSessionStatus,
): AuthSessionSnapshot {
	const isAuthenticated = state.accessToken !== null && state.user !== null;
	if (!isAuthenticated) {
		if (status === "restoring") {
			return RESTORING_SNAPSHOT;
		}
		if (status === "idle") {
			return IDLE_SNAPSHOT;
		}
		return READY_EMPTY_SNAPSHOT;
	}
	return { user: state.user, isAuthenticated: true, status };
}

/**
 * Browser auth session for `@apps/auth`.
 * Player API calls use the HttpOnly access cookie; `restore()` is optional and off on Play home.
 */
export class AuthSession {
	readonly options: ResolvedAuthSessionOptions;
	#state: AuthSessionState = { accessToken: null, user: null, expiresAt: null };
	#status: AuthSessionStatus = "idle";
	#snapshot: AuthSessionSnapshot = IDLE_SNAPSHOT;
	#refreshPromise: Promise<void> | null = null;
	#restorePromise: Promise<boolean> | null = null;
	#listeners = new Set<() => void>();

	constructor(options?: AuthSessionOptions) {
		this.options = resolveAuthSessionOptions(options);
	}

	subscribe(listener: () => void): () => void {
		this.#listeners.add(listener);
		return () => {
			this.#listeners.delete(listener);
		};
	}

	/**
	 * Cached snapshot for `useSyncExternalStore`.
	 * Same reference until login / logout / restore / user-facing refresh mutates visible state.
	 */
	getSnapshot(): AuthSessionSnapshot {
		return this.#snapshot;
	}

	#publish(
		nextState: AuthSessionState = this.#state,
		nextStatus: AuthSessionStatus = this.#status,
	): void {
		this.#state = nextState;
		this.#status = nextStatus;
		const nextSnapshot = snapshotFromState(nextState, nextStatus);
		if (
			nextSnapshot.user !== this.#snapshot.user ||
			nextSnapshot.isAuthenticated !== this.#snapshot.isAuthenticated ||
			nextSnapshot.status !== this.#snapshot.status
		) {
			this.#snapshot = nextSnapshot;
		}
		this.#notify();
	}

	#notify(): void {
		for (const listener of this.#listeners) {
			listener();
		}
	}

	getAccessToken(): string | undefined {
		return this.#state.accessToken ?? undefined;
	}

	getTenantId(): string | undefined {
		return this.#state.user?.tenantId;
	}

	getUser(): AuthUser | null {
		return this.#state.user;
	}

	getStatus(): AuthSessionStatus {
		return this.#status;
	}

	isAuthenticated(): boolean {
		return this.#snapshot.isAuthenticated;
	}

	isReady(): boolean {
		return this.#status === "ready";
	}

	hasSessionCookie(): boolean {
		return getCookie(this.options.sessionCookieName) !== null;
	}

	applyLogin(result: AuthLoginResult): void {
		setCookie(this.options.sessionCookieName, result.sessionId, this.options.cookieMaxAgeSeconds);
		setCookie(
			this.options.refreshCookieName,
			result.refreshToken,
			this.options.cookieMaxAgeSeconds,
		);
		this.#publish(
			{
				accessToken: result.accessToken,
				user: result.user,
				expiresAt: Date.now() + this.options.accessTtlMs,
			},
			"ready",
		);
	}

	clear(): void {
		clearCookie(this.options.sessionCookieName);
		clearCookie(this.options.refreshCookieName);
		this.#publish({ accessToken: null, user: null, expiresAt: null }, "ready");
	}

	readonly refreshCoordination = {
		isRefreshInFlight: (): boolean => this.#refreshPromise !== null,
		waitForRefresh: (): Promise<void> => this.#refreshPromise ?? Promise.resolve(),
	};

	async login(email: string, password: string): Promise<void> {
		const result = await loginWithPassword(this.options.trpcBaseUrl, email, password);
		this.applyLogin(result);
	}

	async logout(): Promise<void> {
		try {
			await logoutSession(this.options.trpcBaseUrl);
		} catch {
			// Always clear local session.
		}
		this.clear();
	}

	/**
	 * SPA cold start: exchange refresh/session cookies for an access token + `auth.me` user.
	 * Idempotent; safe to call from `AuthProvider` on mount.
	 */
	async restore(): Promise<boolean> {
		if (this.isAuthenticated() && this.#status === "ready") {
			return true;
		}
		if (this.#restorePromise) {
			return this.#restorePromise;
		}

		this.#restorePromise = (async () => {
			this.#publish(this.#state, "restoring");
			try {
				const sessionId = getCookie(this.options.sessionCookieName);
				const refreshToken = getCookie(this.options.refreshCookieName);
				if (sessionId === null || refreshToken === null) {
					this.#publish(this.#state, "ready");
					return false;
				}
				await this.refreshToken();
				if (this.#state.user === null) {
					const me = await fetchAuthMe(this.options.trpcBaseUrl);
					const user = authUserFromMe(me);
					this.#publish(
						{
							accessToken: this.#state.accessToken,
							user,
							expiresAt: this.#state.expiresAt,
						},
						"ready",
					);
					return true;
				}
				this.#publish(this.#state, "ready");
				return true;
			} catch {
				if (this.isAuthenticated()) {
					this.#publish(this.#state, "ready");
					return true;
				}
				this.clear();
				return false;
			}
		})().finally(() => {
			this.#restorePromise = null;
		});

		return this.#restorePromise;
	}

	async refreshAccessTokenIfExpiringSoon(skewMs = 60_000): Promise<void> {
		const { expiresAt, accessToken } = this.#state;
		if (!accessToken || expiresAt === null) {
			return;
		}
		if (expiresAt - Date.now() > skewMs) {
			return;
		}
		await this.refreshToken();
	}

	async refreshToken(): Promise<void> {
		if (this.#refreshPromise) {
			return this.#refreshPromise;
		}
		this.#refreshPromise = (async () => {
			const sessionId = getCookie(this.options.sessionCookieName);
			const refreshToken = getCookie(this.options.refreshCookieName);
			const hasBody = sessionId !== null && refreshToken !== null;
			const response = await fetch(this.options.refreshUrl, {
				method: "POST",
				credentials: "include",
				headers: hasBody ? { "content-type": "application/json" } : undefined,
				body: hasBody
					? JSON.stringify({ session_id: sessionId, refresh_token: refreshToken })
					: undefined,
			});
			if (!response.ok) {
				this.clear();
				throw new Error("Session expired");
			}
			const body: unknown = await response.json().catch(() => null);
			if (!isRecord(body) || typeof body.access_token !== "string") {
				this.#notify();
				return;
			}
			if (typeof body.refresh_token === "string") {
				setCookie(
					this.options.refreshCookieName,
					body.refresh_token,
					this.options.cookieMaxAgeSeconds,
				);
			}
			if (typeof body.session_id === "string") {
				setCookie(
					this.options.sessionCookieName,
					body.session_id,
					this.options.cookieMaxAgeSeconds,
				);
			}
			const user = parseAuthUser(body.user) ?? this.#state.user;
			this.#state = {
				...this.#state,
				accessToken: body.access_token,
				user,
				expiresAt:
					Date.now() + (typeof body.expires_in === "number" ? body.expires_in : 900) * 1000,
			};
			this.#notify();
		})().finally(() => {
			this.#refreshPromise = null;
		});
		return this.#refreshPromise;
	}
}

/** Default singleton — apps may also `new AuthSession({ ... })`. */
export const authSession = new AuthSession();

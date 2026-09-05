import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
} from "react";

import { loginHref } from "../login-href";
import {
	type AuthSession,
	type AuthSessionStatus,
	authSession as defaultAuthSession,
} from "../session";
import type { AuthUser } from "../types";

export type AuthContextValue = {
	readonly session: AuthSession;
	readonly user: AuthUser | null;
	readonly isAuthenticated: boolean;
	readonly isReady: boolean;
	readonly status: AuthSessionStatus;
	readonly login: (email: string, password: string) => Promise<void>;
	readonly logout: () => Promise<void>;
	readonly getLoginHref: (next?: string) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
	readonly session?: AuthSession;
	readonly restoreOnMount?: boolean;
	readonly authOrigin?: string;
	readonly appOrigin?: string;
	readonly loginPath?: string;
	readonly callbackPath?: string;
	readonly children: ReactNode;
};

/**
 * React auth state only — does **not** wrap `FetcherSettingsProvider`.
 * Compose with `@packages/http/react` in the app (see {@link createAuthFetcherBindings}).
 */
export function AuthProvider({
	session = defaultAuthSession,
	restoreOnMount = true,
	authOrigin,
	appOrigin,
	loginPath = "/login",
	callbackPath = "/hub",
	children,
}: AuthProviderProps) {
	const snapshot = useSyncExternalStore(
		(onStoreChange) => session.subscribe(onStoreChange),
		() => session.getSnapshot(),
		() => session.getSnapshot(),
	);

	useEffect(() => {
		if (!restoreOnMount) {
			return;
		}
		void session.restore();
	}, [session, restoreOnMount]);

	const login = useCallback(
		async (email: string, password: string) => {
			await session.login(email, password);
		},
		[session],
	);

	const logout = useCallback(async () => {
		await session.logout();
	}, [session]);

	const getLoginHref = useCallback(
		(next = "/") => {
			if (authOrigin && appOrigin) {
				return loginHref({
					authOrigin,
					loginPath,
					redirectUri: `${appOrigin.replace(/\/$/, "")}${callbackPath}`,
					state: next,
				});
			}
			const params = new URLSearchParams({ next });
			return `${loginPath}?${params.toString()}`;
		},
		[authOrigin, appOrigin, loginPath, callbackPath],
	);

	const value = useMemo<AuthContextValue>(
		() => ({
			session,
			user: snapshot.user,
			isAuthenticated: snapshot.isAuthenticated,
			isReady: snapshot.status === "ready",
			status: snapshot.status,
			login,
			logout,
			getLoginHref,
		}),
		[
			session,
			snapshot.user,
			snapshot.isAuthenticated,
			snapshot.status,
			login,
			logout,
			getLoginHref,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const value = useContext(AuthContext);
	if (!value) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return value;
}

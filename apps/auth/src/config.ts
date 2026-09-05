function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required env: ${name}`);
	}
	return value;
}

function optionalEnv(name: string, fallback: string): string {
	return process.env[name] ?? fallback;
}

function parseCsvOrigins(name: string, fallback: string): readonly string[] {
	const raw = process.env[name];
	const source = raw && raw.trim().length > 0 ? raw : fallback;
	return source
		.split(",")
		.map((part) => part.trim().replace(/\/$/, ""))
		.filter((part) => part.length > 0);
}

export const authConfig = {
	host: optionalEnv("HOST", "0.0.0.0"),
	port: Number(optionalEnv("AUTH_PORT", optionalEnv("PORT", "3007"))),
	issuer: optionalEnv("AUTH_ISSUER", "http://localhost:3007"),
	audience: optionalEnv("AUTH_AUDIENCE", "fivenines-api"),
	audienceEval: optionalEnv("AUTH_AUDIENCE_EVAL", "fivenines-eval"),
	accessTtlSeconds: Number(optionalEnv("AUTH_ACCESS_TTL_SECONDS", "900")),
	refreshTtlDays: 30,
	databaseUrl: () => requireEnv("AUTH_DATABASE_URL"),
	cookieSession: optionalEnv("AUTH_COOKIE_SESSION", "auth_session"),
	cookieRefresh: optionalEnv("AUTH_COOKIE_REFRESH", "auth_refresh"),
	cookieAccess: optionalEnv("AUTH_COOKIE_ACCESS", "auth_access"),
	cookieLoggedIn: optionalEnv("AUTH_COOKIE_LOGGED_IN", "was_logged_in"),
	cookieCsrf: optionalEnv("AUTH_COOKIE_CSRF", "auth_csrf"),
	cookieSecure: optionalEnv("AUTH_COOKIE_SECURE", "false") === "true",
	cookieDomain: optionalEnv("AUTH_COOKIE_DOMAIN", ".fivenines.test"),
	playOrigin: optionalEnv("AUTH_PLAY_ORIGIN", "http://play.fivenines.test:3001"),
	jwtPrivateKey: () => optionalEnv("AUTH_JWT_PRIVATE_KEY", "./dev-keys/private.pem"),
	jwtPublicKey: () => optionalEnv("AUTH_JWT_PUBLIC_KEY", "./dev-keys/public.pem"),
	seedAdminEmail: optionalEnv("AUTH_SEED_ADMIN_EMAIL", "admin@example.com"),
	seedAdminPassword: () => requireEnv("AUTH_SEED_ADMIN_PASSWORD"),
	allowRegistration:
		optionalEnv(
			"AUTH_ALLOW_REGISTRATION",
			optionalEnv("NODE_ENV", "development") === "production" ? "false" : "true",
		) === "true",
	allowOtp:
		optionalEnv(
			"AUTH_ALLOW_OTP",
			optionalEnv("NODE_ENV", "development") === "production" ? "false" : "true",
		) === "true",
	otpLogToConsole: optionalEnv("AUTH_OTP_LOG", "false") === "true",
	otpTtlMinutes: Number(optionalEnv("AUTH_OTP_TTL_MINUTES", "10")),
	redirectOrigins: parseCsvOrigins("AUTH_REDIRECT_ORIGINS", "http://play.fivenines.test:3001"),
} as const;

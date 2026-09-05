import type { AuthLoginResult } from "@packages/auth";
import { cookies } from "@packages/utils/cookies";
import { log } from "@packages/utils/logger";

import { authConfig } from "./config";
import { LoginPage } from "./pages/login";
import { LogoutPage } from "./pages/logout";
import { OtpPage } from "./pages/otp";
import { RegisterPage } from "./pages/register";
import { createCsrfToken, csrfCookieFlags, validateCsrf } from "./trpc/auth/csrf";
import { getJwks } from "./trpc/auth/keys";
import { handleTokenRequest } from "./trpc/auth/m2m";
import { handleRefreshRequest } from "./trpc/auth/refresh";
import { appendClearedAuthCookies, appendLoginSessionCookies } from "./trpc/auth/session";
import { createCaller } from "./trpc/caller";
import { createContext, getCsrfFromRequest } from "./trpc/context";
import { handleTrpcRequest } from "./trpc/handler";
import { corsPreflight, withCors } from "./utils/cors";
import { getFormField } from "./utils/form-fields";
import {
	type LoginReturn,
	type LoginReturnForm,
	loginReturnFieldProps,
	loginReturnFromRequest,
	loginReturnLocation,
} from "./utils/login-return";
import { renderPage } from "./utils/render-page";

const maxAge = authConfig.refreshTtlDays * 24 * 60 * 60;

function htmlResponse(
	body: string,
	options: { status?: number; csrfToken?: string } = {},
): Response {
	let headers = new Headers({ "content-type": "text/html; charset=utf-8" });
	if (options.csrfToken) {
		headers =
			cookies.set(authConfig.cookieCsrf, options.csrfToken, csrfCookieFlags(maxAge), headers) ??
			headers;
	}
	return new Response(body, { status: options.status ?? 200, headers });
}

function loginReturn(req: Request, form?: FormData): LoginReturn {
	if (!form) {
		return loginReturnFromRequest(req);
	}
	return loginReturnFromRequest(req, {
		redirectUri: getFormField(form, "redirect_uri"),
		state: getFormField(form, "state"),
		next: getFormField(form, "next"),
	});
}

function redirectAfterLogin(result: AuthLoginResult, req: Request, form: FormData): Response {
	const headers = appendLoginSessionCookies(
		new Headers({ location: loginReturnLocation(loginReturn(req, form)) }),
		result,
	);
	return new Response(null, { status: 302, headers });
}

function returnProps(req: Request, form?: FormData): LoginReturnForm {
	return loginReturnFieldProps(loginReturn(req, form));
}

function validateFormCsrf(req: Request, csrf: string): boolean {
	return validateCsrf(getCsrfFromRequest(req), csrf);
}

async function handleLoginGet(req: Request): Promise<Response> {
	const csrfToken = createCsrfToken();
	return htmlResponse(renderPage(<LoginPage csrfToken={csrfToken} {...returnProps(req)} />), {
		csrfToken,
	});
}

async function handleLoginPost(req: Request): Promise<Response> {
	const form = await req.formData();
	const email = getFormField(form, "email");
	const password = getFormField(form, "password");
	const csrf = getFormField(form, "csrf");
	const csrfToken = createCsrfToken();
	const fields = returnProps(req, form);
	if (!validateFormCsrf(req, csrf)) {
		return htmlResponse(
			renderPage(
				<LoginPage csrfToken={csrfToken} error="Invalid CSRF token" email={email} {...fields} />,
			),
			{
				status: 403,
				csrfToken,
			},
		);
	}

	try {
		const ctx = await createContext(req);
		const result = await createCaller(ctx).auth.login({ email, password });
		return redirectAfterLogin(result, req, form);
	} catch {
		return htmlResponse(
			renderPage(
				<LoginPage
					csrfToken={csrfToken}
					error="Invalid email or password"
					email={email}
					{...fields}
				/>,
			),
			{ status: 401, csrfToken },
		);
	}
}

async function handleRegisterGet(req: Request): Promise<Response> {
	const csrfToken = createCsrfToken();
	return htmlResponse(renderPage(<RegisterPage csrfToken={csrfToken} {...returnProps(req)} />), {
		csrfToken,
	});
}

async function handleRegisterPost(req: Request): Promise<Response> {
	const form = await req.formData();
	const email = getFormField(form, "email");
	const password = getFormField(form, "password");
	const tenantName = getFormField(form, "tenantName");
	const csrf = getFormField(form, "csrf");
	const csrfToken = createCsrfToken();
	const fields = returnProps(req, form);
	if (!validateFormCsrf(req, csrf)) {
		return htmlResponse(
			renderPage(
				<RegisterPage
					csrfToken={csrfToken}
					error="Invalid CSRF token"
					email={email}
					tenantName={tenantName}
					{...fields}
				/>,
			),
			{ status: 403, csrfToken },
		);
	}

	try {
		const ctx = await createContext(req);
		const result = await createCaller(ctx).auth.register({
			email,
			password,
			tenantName: tenantName || undefined,
		});
		return redirectAfterLogin(result, req, form);
	} catch (error) {
		const message =
			error instanceof Error && error.message.includes("already registered")
				? "Email already registered"
				: "Could not create account";
		return htmlResponse(
			renderPage(
				<RegisterPage
					csrfToken={csrfToken}
					error={message}
					email={email}
					tenantName={tenantName}
					{...fields}
				/>,
			),
			{ status: 400, csrfToken },
		);
	}
}

async function handleOtpGet(req: Request): Promise<Response> {
	const csrfToken = createCsrfToken();
	return htmlResponse(
		renderPage(<OtpPage csrfToken={csrfToken} step="request" {...returnProps(req)} />),
		{ csrfToken },
	);
}

async function handleOtpPost(req: Request): Promise<Response> {
	const form = await req.formData();
	const email = getFormField(form, "email");
	const csrf = getFormField(form, "csrf");
	const csrfToken = createCsrfToken();
	const fields = returnProps(req, form);
	if (!validateFormCsrf(req, csrf)) {
		return htmlResponse(
			renderPage(
				<OtpPage
					csrfToken={csrfToken}
					step="request"
					error="Invalid CSRF token"
					email={email}
					{...fields}
				/>,
			),
			{
				status: 403,
				csrfToken,
			},
		);
	}

	try {
		const ctx = await createContext(req);
		await createCaller(ctx).auth.requestOtp({ email });
		const info = authConfig.otpLogToConsole
			? "Code sent. Check the auth server logs (AUTH_OTP_LOG=true)."
			: "If this email is valid, a code was sent.";
		return htmlResponse(
			renderPage(
				<OtpPage csrfToken={csrfToken} step="verify" email={email} info={info} {...fields} />,
			),
			{ csrfToken },
		);
	} catch {
		return htmlResponse(
			renderPage(
				<OtpPage
					csrfToken={csrfToken}
					step="request"
					error="Could not send code"
					email={email}
					{...fields}
				/>,
			),
			{
				status: 400,
				csrfToken,
			},
		);
	}
}

async function handleOtpVerifyPost(req: Request): Promise<Response> {
	const form = await req.formData();
	const email = getFormField(form, "email");
	const code = getFormField(form, "code");
	const csrf = getFormField(form, "csrf");
	const csrfToken = createCsrfToken();
	const fields = returnProps(req, form);
	if (!validateFormCsrf(req, csrf)) {
		return htmlResponse(
			renderPage(
				<OtpPage
					csrfToken={csrfToken}
					step="verify"
					error="Invalid CSRF token"
					email={email}
					{...fields}
				/>,
			),
			{ status: 403, csrfToken },
		);
	}

	try {
		const ctx = await createContext(req);
		const result = await createCaller(ctx).auth.verifyOtp({ email, code });
		return redirectAfterLogin(result, req, form);
	} catch {
		return htmlResponse(
			renderPage(
				<OtpPage
					csrfToken={csrfToken}
					step="verify"
					error="Invalid or expired code"
					email={email}
					{...fields}
				/>,
			),
			{ status: 401, csrfToken },
		);
	}
}

async function handleLogoutGet(req: Request): Promise<Response> {
	const ctx = await createContext(req);
	if (ctx.sessionId) {
		await createCaller(ctx).auth.logout();
	}
	const headers = appendClearedAuthCookies(
		new Headers({ "content-type": "text/html; charset=utf-8" }),
	);
	return new Response(renderPage(<LogoutPage />), { headers });
}

type RouteHandler = (req: Request) => Response | Promise<Response>;

const routes: Array<{ method: string; path: string; handle: RouteHandler }> = [
	{
		method: "GET",
		path: "/status",
		handle: () => Response.json({ ok: true, timestamp: new Date().toISOString() }),
	},
	{
		method: "GET",
		path: "/.well-known/jwks.json",
		handle: async () => Response.json(await getJwks()),
	},
	{ method: "POST", path: "/api/refresh", handle: handleRefreshRequest },
	{ method: "POST", path: "/api/token", handle: handleTokenRequest },
	{ method: "GET", path: "/login", handle: handleLoginGet },
	{ method: "POST", path: "/login", handle: handleLoginPost },
	{ method: "GET", path: "/register", handle: handleRegisterGet },
	{ method: "POST", path: "/register", handle: handleRegisterPost },
	{ method: "GET", path: "/otp", handle: handleOtpGet },
	{ method: "POST", path: "/otp", handle: handleOtpPost },
	{ method: "POST", path: "/otp/verify", handle: handleOtpVerifyPost },
	{ method: "GET", path: "/logout", handle: handleLogoutGet },
	{
		method: "GET",
		path: "/",
		handle: () =>
			Response.json({
				service: "@apps/auth",
				docs: "/login",
				register: "/register",
				otp: "/otp",
			}),
	},
];

const server = Bun.serve({
	hostname: authConfig.host,
	port: authConfig.port,
	async fetch(req) {
		if (req.method === "OPTIONS") {
			return corsPreflight(req, authConfig.redirectOrigins);
		}

		const url = new URL(req.url);
		const route = routes.find((r) => r.path === url.pathname && r.method === req.method);
		let response: Response;
		if (route) {
			response = await route.handle(req);
		} else if (url.pathname.startsWith("/api")) {
			response = await handleTrpcRequest(req);
		} else {
			response = new Response("Not Found", { status: 404 });
		}
		return withCors(req, response, authConfig.redirectOrigins);
	},
});

log(`@apps/auth listening on http://${server.hostname}:${server.port}`);

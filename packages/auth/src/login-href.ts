export type LoginHrefInput = {
	readonly authOrigin: string;
	readonly appOrigin: string;
	readonly redirectUri: string;
	readonly loginPath?: string;
};

export type LoginHrefOptions = {
	readonly redirectUri: string;
};

function stripTrailingSlash(origin: string): string {
	return origin.replace(/\/$/, "");
}

export function redirectState(redirectUri: string): string {
	if (redirectUri.startsWith("http://") || redirectUri.startsWith("https://")) {
		const url = new URL(redirectUri);
		const path = `${url.pathname}${url.search}`;
		return path.length > 0 ? path : "/";
	}
	return redirectUri.startsWith("/") ? redirectUri : `/${redirectUri}`;
}

export function absoluteRedirectUri(redirectUri: string, appOrigin: string): string {
	if (redirectUri.startsWith("http://") || redirectUri.startsWith("https://")) {
		return redirectUri;
	}
	const path = redirectUri.startsWith("/") ? redirectUri : `/${redirectUri}`;
	return `${stripTrailingSlash(appOrigin)}${path}`;
}

export function loginHref(input: LoginHrefInput): string {
	const loginPath = input.loginPath && input.loginPath.length > 0 ? input.loginPath : "/login";
	const url = new URL(loginPath, `${stripTrailingSlash(input.authOrigin)}/`);
	url.searchParams.set("redirect_uri", absoluteRedirectUri(input.redirectUri, input.appOrigin));
	url.searchParams.set("state", redirectState(input.redirectUri));
	return url.toString();
}

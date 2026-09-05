export type LoginHrefInput = {
	readonly authOrigin: string;
	readonly redirectUri: string;
	readonly state?: string;
	readonly loginPath?: string;
};

export function loginHref(input: LoginHrefInput): string {
	const loginPath = input.loginPath && input.loginPath.length > 0 ? input.loginPath : "/login";
	const url = new URL(loginPath, `${input.authOrigin.replace(/\/$/, "")}/`);
	url.searchParams.set("redirect_uri", input.redirectUri);
	if (input.state !== undefined && input.state.length > 0) {
		url.searchParams.set("state", input.state);
	}
	return url.toString();
}

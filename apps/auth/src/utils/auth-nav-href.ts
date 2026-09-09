import type { LoginReturnForm } from "./login-return";

export function authNavHref(path: string, ret: LoginReturnForm): string {
	const url = new URL(path, "https://auth.local");
	if (ret.redirectUri !== undefined && ret.redirectUri.length > 0) {
		url.searchParams.set("redirect_uri", ret.redirectUri);
		if (ret.state !== undefined && ret.state.length > 0) {
			url.searchParams.set("state", ret.state);
		}
		return `${url.pathname}${url.search}`;
	}
	if (ret.next !== undefined && ret.next.length > 0) {
		url.searchParams.set("next", ret.next);
	}
	return `${url.pathname}${url.search}`;
}

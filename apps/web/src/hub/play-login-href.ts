import { loginHref } from "@packages/auth/login-href";
import { getAppOrigin, getAuthOrigin } from "@packages/utils/origins";

export function playLoginHref(): string {
	return loginHref({
		authOrigin: getAuthOrigin(import.meta.env.VITE_AUTH_URL),
		redirectUri: `${getAppOrigin(import.meta.env.VITE_APP_ORIGIN)}/hub`,
		state: "/hub",
	});
}

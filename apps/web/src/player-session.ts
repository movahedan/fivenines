import { AuthSession } from "@packages/auth";

const authOrigin = import.meta.env.VITE_AUTH_URL;

export const playerAuthSession = new AuthSession({
	refreshUrl: `${authOrigin}/api/refresh`,
	trpcBaseUrl: `${authOrigin}/api`,
});

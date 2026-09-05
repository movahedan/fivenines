import { AuthSession } from "@packages/auth";
import { getAuthOrigin } from "@packages/utils/origins";

const authOrigin = getAuthOrigin(import.meta.env.VITE_AUTH_URL);

export const playerAuthSession = new AuthSession({
	refreshUrl: `${authOrigin}/api/refresh`,
	trpcBaseUrl: `${authOrigin}/api`,
});

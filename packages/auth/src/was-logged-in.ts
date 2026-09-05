import { cookies } from "@packages/utils/cookies";

export const WAS_LOGGED_IN_COOKIE = "was_logged_in";

export function hasWasLoggedInCookie(): boolean {
	return cookies.get(WAS_LOGGED_IN_COOKIE) !== null;
}

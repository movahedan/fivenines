export const WAS_LOGGED_IN_COOKIE = "was_logged_in";

export function hasWasLoggedInCookie(): boolean {
	if (typeof document === "undefined") {
		return false;
	}
	const prefix = `${WAS_LOGGED_IN_COOKIE}=`;
	return document.cookie.split(";").some((part) => part.trim().startsWith(prefix));
}

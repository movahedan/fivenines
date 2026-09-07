export const POST_LOGOUT_PATH = "/";

let returnHomeAfterLogout = false;

export function beginReturnHomeAfterLogout(): void {
	returnHomeAfterLogout = true;
}

export function isReturnHomeAfterLogout(): boolean {
	return returnHomeAfterLogout;
}

export function resetReturnHomeAfterLogout(): void {
	returnHomeAfterLogout = false;
}

export function goHomeAfterLogout(): void {
	beginReturnHomeAfterLogout();
	window.location.replace(POST_LOGOUT_PATH);
}

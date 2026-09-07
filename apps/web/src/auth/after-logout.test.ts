import { afterEach, describe, expect, it, mock } from "bun:test";

import {
	beginReturnHomeAfterLogout,
	goHomeAfterLogout,
	isReturnHomeAfterLogout,
	POST_LOGOUT_PATH,
	resetReturnHomeAfterLogout,
} from "./after-logout";

describe("after-logout - web home return", () => {
	afterEach(() => {
		resetReturnHomeAfterLogout();
		mock.restore();
	});

	it("starts unset and records the home return after begin", () => {
		expect(isReturnHomeAfterLogout()).toBe(false);
		beginReturnHomeAfterLogout();
		expect(isReturnHomeAfterLogout()).toBe(true);
		expect(POST_LOGOUT_PATH).toBe("/");
	});

	it("replaces the location with home when goHomeAfterLogout runs", () => {
		const replace = mock(() => undefined);
		window.location.replace = replace as typeof window.location.replace;

		goHomeAfterLogout();

		expect(isReturnHomeAfterLogout()).toBe(true);
		expect(replace).toHaveBeenCalledWith("/");
	});
});

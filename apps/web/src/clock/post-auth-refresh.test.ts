import { afterEach, describe, expect, it, mock } from "bun:test";

import { postAuthRefresh } from "./post-auth-refresh";

describe("postAuthRefresh - cookie session", () => {
	afterEach(() => {
		mock.restore();
	});

	it("returns true when auth refresh responds ok", async () => {
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 200 })),
		) as unknown as typeof fetch;

		expect(await postAuthRefresh()).toBe(true);
	});

	it("returns false when auth refresh fails", async () => {
		globalThis.fetch = mock(async () =>
			Promise.resolve(new Response(null, { status: 401 })),
		) as unknown as typeof fetch;

		expect(await postAuthRefresh()).toBe(false);
	});
});

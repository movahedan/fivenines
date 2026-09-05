import { afterEach, describe, expect, it } from "bun:test";

import { cookies } from "./cookies";

function stubDocumentCookie(value: string): void {
	Object.defineProperty(document, "cookie", {
		configurable: true,
		enumerable: true,
		get: () => value,
	});
}

describe("cookies.get - header or document", () => {
	afterEach(() => {
		Reflect.deleteProperty(document, "cookie");
	});

	it("reads the named cookie from document when headers are omitted", () => {
		stubDocumentCookie("was_logged_in=1; auth_session=sess");

		expect(cookies.get("was_logged_in")).toBe("1");
		expect(cookies.get("auth_session")).toBe("sess");
		expect(cookies.get("missing")).toBeNull();
	});

	it("reads from a Cookie header string when headers are passed", () => {
		stubDocumentCookie("was_logged_in=document");

		expect(cookies.get("auth_access", "auth_access=header.payload.sig")).toBe("header.payload.sig");
		expect(cookies.get("was_logged_in", "auth_access=token")).toBeNull();
	});

	it("reads cookie from a request headers record", () => {
		expect(
			cookies.get("auth_access", {
				cookie: "a=1; auth_access=jwt-value",
				authorization: "Bearer x",
			}),
		).toBe("jwt-value");
	});

	it("reads cookie from Fetch Headers", () => {
		const headers = new Headers({ cookie: "auth_access=from-headers" });

		expect(cookies.get("auth_access", headers)).toBe("from-headers");
	});

	it("decodes percent-encoded values", () => {
		expect(cookies.get("sid", "sid=sess%2Did")).toBe("sess-id");
	});
});

describe("cookies.set and cookies.delete", () => {
	afterEach(() => {
		Reflect.deleteProperty(document, "cookie");
	});

	it("appends Set-Cookie on a cloned Headers object", () => {
		const original = new Headers({ "content-type": "text/plain" });
		const next = cookies.set("auth_session", "sess-id", { path: "/", httpOnly: true }, original);

		expect(original.getSetCookie()).toEqual([]);
		expect(next.getSetCookie()[0]).toContain("auth_session=sess-id");
		expect(next.getSetCookie()[0]).toContain("HttpOnly");
		expect(next.get("content-type")).toBe("text/plain");
	});

	it("writes document.cookie when headers are omitted", () => {
		let jar = "";
		Object.defineProperty(document, "cookie", {
			configurable: true,
			enumerable: true,
			get: () => jar,
			set: (value: string) => {
				jar = value;
			},
		});

		cookies.set("was_logged_in", "1", { path: "/", maxAge: 60, sameSite: "Strict" });

		expect(jar).toContain("was_logged_in=1");
		expect(jar).toContain("Max-Age=60");
	});

	it("clears a cookie with Max-Age=0 on Headers", () => {
		const next = cookies.delete(
			"auth_session",
			{ path: "/", domain: ".fivenines.com" },
			new Headers(),
		);

		expect(next.getSetCookie()[0]).toContain("auth_session=");
		expect(next.getSetCookie()[0]).toContain("Max-Age=0");
		expect(next.getSetCookie()[0]).toContain("Domain=.fivenines.com");
	});
});

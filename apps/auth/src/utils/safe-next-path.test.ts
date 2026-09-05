import { describe, expect, it } from "bun:test";

import { nextFromRequest, safeNextPath } from "./safe-next-path";

describe("safeNextPath - allowlist", () => {
	it("returns fallback when value is missing", () => {
		expect(safeNextPath(undefined)).toBe("/");
		expect(safeNextPath("")).toBe("/");
	});

	it("accepts a relative path", () => {
		expect(safeNextPath("/hub")).toBe("/hub");
		expect(safeNextPath("/hub?x=1")).toBe("/hub?x=1");
	});

	it("rejects protocol-relative and absolute URLs", () => {
		expect(safeNextPath("//evil.example/phish")).toBe("/");
		expect(safeNextPath("https://evil.example/")).toBe("/");
		expect(safeNextPath("/\\evil")).toBe("/");
	});
});

describe("nextFromRequest - form then query", () => {
	it("prefers a safe form next over the query string", () => {
		const req = new Request("https://auth.test/login?next=/other");
		expect(nextFromRequest(req, "/hub")).toBe("/hub");
	});

	it("uses query next when form is empty", () => {
		const req = new Request("https://auth.test/login?next=/hub");
		expect(nextFromRequest(req)).toBe("/hub");
	});
});

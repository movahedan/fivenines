import { describe, expect, it } from "bun:test";

import { assertHourIndex } from "./clock";
import { type IdentityRecord, IdentityRegistry } from "./registry";

describe("identity registry - uniqueness", () => {
	it("indexes owned records by owner id", () => {
		const registry = new IdentityRegistry();

		registry.register({ kind: "customer", id: "acme", ownerId: null });
		registry.registerAll([
			{ kind: "project", id: "acme-web", ownerId: "acme" },
			{ kind: "asset", id: "server-1", ownerId: "game" },
		]);

		expect(registry.get("project", "acme-web").ownerId).toBe("acme");
		expect(registry.ownedBy("acme").map((row) => row.id)).toEqual(["acme-web"]);

		(registry.ownedBy("acme") as IdentityRecord[]).pop();
		expect(registry.ownedBy("acme").map((row) => row.id)).toEqual(["acme-web"]);
	});

	it("rejects a customer owned by another customer", () => {
		const registry = new IdentityRegistry();

		expect(() => registry.register({ kind: "customer", id: "acme", ownerId: "other" })).toThrow(
			"customer owner must be null or game",
		);
	});

	it("rejects a duplicate id across kinds", () => {
		const registry = new IdentityRegistry();

		expect(() =>
			registry.registerAll([
				{ kind: "project", id: "shared", ownerId: "acme" },
				{ kind: "asset", id: "shared", ownerId: "game" },
			]),
		).toThrow("duplicate id: shared");
	});
});

describe("identity registry - atomic insert", () => {
	it("leaves prior records unchanged when a batch fails", () => {
		const registry = new IdentityRegistry();

		registry.registerAll([{ kind: "customer", id: "acme", ownerId: null }]);

		expect(() =>
			registry.registerAll([
				{ kind: "project", id: "ok", ownerId: "acme" },
				{ kind: "customer", id: "acme", ownerId: null },
			]),
		).toThrow("duplicate id: acme");

		expect(registry.get("customer", "acme").kind).toBe("customer");
		expect(() => registry.get("project", "ok")).toThrow("unknown project id: ok");
	});
});

describe("identity clock - hour index", () => {
	it("accepts a non-negative hour index", () => {
		expect(assertHourIndex(0)).toBe(0);
		expect(assertHourIndex(168)).toBe(168);
	});

	it("rejects a fractional hour index", () => {
		expect(() => assertHourIndex(1.5)).toThrow("hourIndex must be a finite integer");
	});
});

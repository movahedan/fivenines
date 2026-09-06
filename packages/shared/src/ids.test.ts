import { describe, expect, it } from "bun:test";

import { ids } from "./ids";

describe("ids - uniqueness", () => {
	it("returns when every id is unique", () => {
		expect(() => ids.assertUnique(["a", "b"], "customer")).not.toThrow();
	});

	it("throws when an id is duplicated", () => {
		expect(() => ids.assertUnique(["a", "a"], "customer")).toThrow("duplicate customer id: a");
	});
});

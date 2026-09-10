import { describe, expect, it } from "bun:test";

import { conserveWork } from "./conservation";

describe("work - conservation", () => {
	it("requires demanded to equal handled plus waiting plus rejected plus infeasible", () => {
		expect(
			conserveWork({
				demanded: 10,
				handled: 4,
				waiting: 3,
				rejected: 2,
				infeasible: 1,
			}),
		).toBe(true);
		expect(
			conserveWork({
				demanded: 10,
				handled: 4,
				waiting: 3,
				rejected: 2,
				infeasible: 0,
			}),
		).toBe(false);
	});
});

import { describe, expect, it } from "bun:test";

import { rhythmFor } from "./category-rhythm";
import { localHour } from "./local-hour";

describe("localHour - timezone wrap", () => {
	it("returns 19 when hourIndex is 0 and offsetHours is -5", () => {
		expect(localHour(0, -5)).toBe(19);
	});
});

describe("rhythmFor - category bands", () => {
	it("returns shopping evening permille 1400 at local hour 20", () => {
		expect(rhythmFor("shopping").permilleForLocalHour(20)).toBe(1400);
	});

	it("returns saas night permille 200 at local hour 3", () => {
		expect(rhythmFor("saas").permilleForLocalHour(3)).toBe(200);
	});

	it("returns portfolio afternoon permille 700 at local hour 15", () => {
		expect(rhythmFor("portfolio").permilleForLocalHour(15)).toBe(700);
	});
});

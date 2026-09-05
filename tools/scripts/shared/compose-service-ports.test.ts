import { describe, expect, it } from "bun:test";

import { expandComposeSubstitution } from "./compose-service-ports";

describe("expandComposeSubstitution", () => {
	it("resolves ${VAR:-default} so parsePortMappings is not given NaN", () => {
		const raw = "${NESTJS_PORT:-3002}:${NESTJS_PORT:-3002}";
		expect(Number(raw.split(":")[0])).toBeNaN();
		expect(expandComposeSubstitution(raw, {})).toBe("3002:3002");
		expect(expandComposeSubstitution(raw, { NESTJS_PORT: "4000" })).toBe("4000:4000");
	});
});

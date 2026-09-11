import { describe, expect, it } from "bun:test";

import { Server } from "../server";
import { TRANSFER_POLICY, transferPayload } from "./transfer-policy";

describe("transfer-policy - payload", () => {
	it("sizes a Bronze copy from one full-link hour of network and half of disk ops", () => {
		const bronze = new Server({ id: "server-1", catalogId: "bronze", region: "utc+0" });

		expect(TRANSFER_POLICY.networkHoursAtFullLink).toBe(1);
		expect(transferPayload(bronze)).toEqual({
			remainingNetworkMiB: bronze.networkBytesPerHour,
			remainingDiskOps: Math.floor(bronze.diskOps / TRANSFER_POLICY.diskHoursAtFullIops),
		});
	});
});

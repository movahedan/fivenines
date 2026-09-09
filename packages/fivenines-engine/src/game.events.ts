import type { ServerHealth } from "./server";

export type EngineEvent =
	| { type: "slaBreached"; hourIndex: number; projectId: string; windowPpm: number }
	| { type: "slaRecovered"; hourIndex: number; projectId: string; windowPpm: number }
	| { type: "paygSettled"; hourIndex: number; cents: number }
	| { type: "weeklyCreditCharged"; hourIndex: number; projectId: string; creditCents: number }
	| { type: "serverSaturated"; hourIndex: number; serverId: string }
	| { type: "cashLow"; hourIndex: number; cashCents: number }
	| { type: "outageDiscovered"; hourIndex: number; serverId: string; health: ServerHealth }
	| { type: "outageEscalated"; hourIndex: number; serverId: string };

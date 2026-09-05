import { describe, expect, it } from "bun:test";

import { consumeClockStream } from "./consume-clock-stream";

function sseBody(chunks: readonly string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			for (const chunk of chunks) {
				controller.enqueue(encoder.encode(chunk));
			}
			controller.close();
		},
	});
}

describe("consumeClockStream - generated clock schema", () => {
	it("emits at from clock.now events", async () => {
		const ats: string[] = [];
		const body = sseBody([
			'event: clock.now\ndata: {"at":"2026-09-04T08:00:00.000Z"}\n\n',
			'event: clock.now\ndata: {"at":"2026-09-04T08:00:01.000Z"}\n\n',
		]);

		await consumeClockStream(body, new AbortController().signal, (at) => {
			ats.push(at);
		});

		expect(ats).toEqual(["2026-09-04T08:00:00.000Z", "2026-09-04T08:00:01.000Z"]);
	});

	it("skips other event names and invalid payloads", async () => {
		const ats: string[] = [];
		const body = sseBody([
			'event: other\ndata: {"at":"2026-09-04T08:00:00.000Z"}\n\n',
			'event: clock.now\ndata: {"nope":true}\n\n',
			'event: clock.now\ndata: {"at":"2026-09-04T08:00:02.000Z"}\n\n',
		]);

		await consumeClockStream(body, new AbortController().signal, (at) => {
			ats.push(at);
		});

		expect(ats).toEqual(["2026-09-04T08:00:02.000Z"]);
	});
});

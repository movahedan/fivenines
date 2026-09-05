import { createParser } from "eventsource-parser";

import { ClockControllerEventsResponse } from "@packages/nestjs-sdk/zod";

const CLOCK_EVENT = "clock.now";

function clockAtFromSseData(data: string): string | undefined {
	let payload: unknown;
	try {
		payload = JSON.parse(data);
	} catch {
		return undefined;
	}

	const parsed = ClockControllerEventsResponse.safeParse(payload);
	return parsed.success ? parsed.data.at : undefined;
}

export async function consumeClockStream(
	body: ReadableStream<Uint8Array>,
	signal: AbortSignal,
	onAt: (at: string) => void,
): Promise<void> {
	const parser = createParser({
		onEvent(event) {
			if (event.event && event.event !== CLOCK_EVENT) {
				return;
			}
			const at = clockAtFromSseData(event.data);
			if (at) {
				onAt(at);
			}
		},
	});

	const reader = body.getReader();
	const decoder = new TextDecoder();

	try {
		while (!signal.aborted) {
			const { done, value } = await reader.read();
			if (done) {
				parser.reset({ consume: true });
				break;
			}
			parser.feed(decoder.decode(value, { stream: true }));
		}
	} finally {
		await reader.cancel().catch(() => undefined);
	}
}

import { afterEach, describe, expect, it, mock } from "bun:test";

import { renderHook, waitFor } from "@testing-library/react";

import { useGameClock } from "./use-game-clock";

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

describe("useGameClock - cookie credentials", () => {
	afterEach(() => {
		mock.restore();
	});

	it("retries the stream after a cookie refresh when the first response is 401", async () => {
		let clockAttempts = 0;
		globalThis.fetch = mock(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("/api/refresh")) {
				return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
			}
			clockAttempts += 1;
			if (clockAttempts === 1) {
				return new Response(null, { status: 401 });
			}
			return new Response(
				sseBody(['event: clock.now\ndata: {"at":"2026-09-04T08:00:00.000Z"}\n\n']),
				{ status: 200 },
			);
		}) as unknown as typeof fetch;

		const { result } = renderHook(() => useGameClock(true));

		await waitFor(() => {
			expect(result.current.status).toBe("live");
		});
		expect(result.current.at).toBe("2026-09-04T08:00:00.000Z");
		expect(clockAttempts).toBe(2);
	});

	it("marks the session unauthenticated when refresh after 401 fails", async () => {
		globalThis.fetch = mock(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("/api/refresh")) {
				return new Response(null, { status: 401 });
			}
			return new Response(null, { status: 401 });
		}) as unknown as typeof fetch;

		const { result } = renderHook(() => useGameClock(true));

		await waitFor(() => {
			expect(result.current.status).toBe("unauthenticated");
		});
	});
});

import { useCallback, useEffect, useRef, useState } from "react";

import { useVisibilityChange } from "@packages/shared-react/useVisibilityChange";

import { getBrowserApiBaseUrl } from "../browser-api-base-url";
import { consumeClockStream } from "./consume-clock-stream";
import { postAuthRefresh } from "./post-auth-refresh";

const CLOCK_EVENTS_PATH = "/api/v1/clock/events";

export interface GameClockState {
	readonly at: string | null;
	readonly status: "idle" | "connecting" | "live" | "error" | "unauthenticated";
}

async function openClockStream(signal: AbortSignal, retried: boolean): Promise<Response> {
	const response = await fetch(`${getBrowserApiBaseUrl()}${CLOCK_EVENTS_PATH}`, {
		credentials: "include",
		signal,
	});
	if (response.status === 401 && !retried) {
		const refreshed = await postAuthRefresh(signal);
		if (refreshed) {
			return openClockStream(signal, true);
		}
	}
	return response;
}

export function useGameClock(enabled: boolean): GameClockState {
	const [at, setAt] = useState<string | null>(null);
	const [status, setStatus] = useState<GameClockState["status"]>("idle");
	const abortRef = useRef<AbortController | null>(null);

	const disconnect = useCallback((): void => {
		abortRef.current?.abort();
		abortRef.current = null;
	}, []);

	const connect = useCallback((): void => {
		if (!enabled) {
			return;
		}

		disconnect();
		const controller = new AbortController();
		abortRef.current = controller;
		setStatus("connecting");

		void (async () => {
			try {
				const response = await openClockStream(controller.signal, false);
				if (controller.signal.aborted) {
					return;
				}
				if (response.status === 401) {
					setStatus("unauthenticated");
					return;
				}
				if (!response.ok || !response.body) {
					throw new Error("Clock stream failed");
				}

				await consumeClockStream(response.body, controller.signal, (nextAt) => {
					setAt(nextAt);
					setStatus("live");
				});
			} catch (error: unknown) {
				if (controller.signal.aborted) {
					return;
				}
				setStatus("error");
				void error;
			}
		})();
	}, [disconnect, enabled]);

	useEffect(() => {
		if (!enabled) {
			disconnect();
			setStatus("idle");
			return disconnect;
		}
		connect();
		return disconnect;
	}, [connect, disconnect, enabled]);

	useVisibilityChange(
		(hidden) => {
			if (!enabled) {
				return;
			}
			if (hidden) {
				disconnect();
				setStatus("idle");
				return;
			}
			connect();
		},
		[connect, disconnect, enabled],
	);

	return { at, status };
}

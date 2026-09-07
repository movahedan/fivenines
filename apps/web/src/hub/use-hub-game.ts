import { useEffect, useRef, useState } from "react";

import {
	type EngineCommand,
	Game,
	OPENING_SHIFT_HOURS,
	openingInitial,
} from "@packages/fivenines-engine";

export const HUB_TICK_MS = 1000;

export interface UseHubGameResult {
	readonly game: Game;
	readonly lastError: string | null;
	readonly running: boolean;
	readonly toggleRunning: () => void;
	readonly dispatch: (command: EngineCommand) => void;
	readonly reset: () => void;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function useHubGame(): UseHubGameResult {
	const gameRef = useRef(new Game(openingInitial));
	const [, setVersion] = useState(0);
	const [lastError, setLastError] = useState<string | null>(null);
	const [running, setRunning] = useState(true);

	const bump = (): void => {
		setVersion((version) => version + 1);
	};

	useEffect(() => {
		if (!running) {
			return;
		}

		const timer = setInterval(() => {
			if (gameRef.current.hourIndex >= OPENING_SHIFT_HOURS) {
				return;
			}

			gameRef.current.tick();
			setLastError(null);
			setVersion((version) => version + 1);
		}, HUB_TICK_MS);

		return () => {
			clearInterval(timer);
		};
	}, [running]);

	const toggleRunning = (): void => {
		if (gameRef.current.hourIndex >= OPENING_SHIFT_HOURS) {
			return;
		}

		setRunning((current) => !current);
	};

	const dispatch = (command: EngineCommand): void => {
		try {
			gameRef.current.dispatch(command);
			setLastError(null);
		} catch (error) {
			setLastError(errorMessage(error));
		}

		bump();
	};

	const reset = (): void => {
		gameRef.current = new Game(openingInitial);
		setLastError(null);
		setRunning(true);
		bump();
	};

	return {
		game: gameRef.current,
		lastError,
		running,
		toggleRunning,
		dispatch,
		reset,
	};
}

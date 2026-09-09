import { useEffect, useRef, useState } from "react";

import {
	type EngineCommand,
	Game,
	OPENING_SHIFT_HOURS,
	openingInitial,
} from "@packages/fivenines-engine";

export const HUB_TICK_MS = 1000;
export const HUB_TICK_SPEEDS = [1, 2, 4] as const;

export type HubTickSpeed = (typeof HUB_TICK_SPEEDS)[number];

export interface UseHubGameResult {
	readonly game: Game;
	readonly lastError: string | null;
	readonly running: boolean;
	readonly speed: HubTickSpeed;
	readonly toggleRunning: () => void;
	readonly setSpeed: (speed: HubTickSpeed) => void;
	readonly dispatch: (command: EngineCommand) => void;
	readonly reset: () => void;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function useHubGame(): UseHubGameResult {
	const gameRef = useRef(new Game(openingInitial, { rollIncidents: true }));
	const [, setVersion] = useState(0);
	const [lastError, setLastError] = useState<string | null>(null);
	const [running, setRunning] = useState(true);
	const [speed, setSpeed] = useState<HubTickSpeed>(1);

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
		}, HUB_TICK_MS / speed);

		return () => {
			clearInterval(timer);
		};
	}, [running, speed]);

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
		gameRef.current = new Game(openingInitial, { rollIncidents: true });
		setLastError(null);
		setRunning(true);
		setSpeed(1);
		bump();
	};

	return {
		game: gameRef.current,
		lastError,
		running,
		speed,
		toggleRunning,
		setSpeed,
		dispatch,
		reset,
	};
}

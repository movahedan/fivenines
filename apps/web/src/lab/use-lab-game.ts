import { useRef, useState } from "react";

import { type EngineCommand, Game, openingInitial } from "@packages/fivenines-engine";

export interface UseLabGameResult {
	readonly game: Game;
	readonly lastError: string | null;
	readonly tick: () => void;
	readonly dispatch: (command: EngineCommand) => void;
	readonly reset: () => void;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function useLabGame(): UseLabGameResult {
	const gameRef = useRef(new Game(openingInitial));
	const [, setVersion] = useState(0);
	const [lastError, setLastError] = useState<string | null>(null);

	const bump = (): void => {
		setVersion((version) => version + 1);
	};

	const tick = (): void => {
		gameRef.current.tick();
		setLastError(null);
		bump();
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
		bump();
	};

	return {
		game: gameRef.current,
		lastError,
		tick,
		dispatch,
		reset,
	};
}

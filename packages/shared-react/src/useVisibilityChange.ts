import { type DependencyList, useEffect } from "react";

export function useVisibilityChange(
	callback: (hidden: boolean) => void,
	deps: DependencyList,
): void {
	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		const onVisibilityChange = (): void => {
			callback(document.hidden);
		};

		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: `callback` is controlled via the caller's `deps` argument
	}, deps);
}

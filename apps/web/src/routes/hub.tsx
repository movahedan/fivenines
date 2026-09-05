import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { hasWasLoggedInCookie } from "@packages/auth/was-logged-in";

import { useGameClock } from "../clock/use-game-clock";
import { playLoginHref } from "../hub/play-login-href";

export const Route = createFileRoute("/hub")({
	component: HubPage,
});

export function HubPage() {
	const [gate, setGate] = useState<"pending" | "ok">("pending");
	const clock = useGameClock(gate === "ok");

	useEffect(() => {
		if (!hasWasLoggedInCookie()) {
			window.location.assign(playLoginHref());
			return;
		}
		setGate("ok");
	}, []);

	useEffect(() => {
		if (clock.status === "unauthenticated") {
			window.location.assign(playLoginHref());
		}
	}, [clock.status]);

	if (gate !== "ok") {
		return (
			<main>
				<p>Redirecting to sign in</p>
			</main>
		);
	}

	return (
		<main>
			<h1>Hub</h1>
			<p>
				{clock.at ? <time dateTime={clock.at}>{clock.at}</time> : <span>Connecting to clock</span>}
			</p>
		</main>
	);
}

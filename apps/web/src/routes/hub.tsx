import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useAuth } from "@packages/auth/react";

import { useGameClock } from "../clock/use-game-clock";

export const Route = createFileRoute("/hub")({
	component: HubPage,
});

export function HubPage() {
	const { wasLoggedIn, loginHref } = useAuth();
	const [gate, setGate] = useState<"pending" | "ok">("pending");
	const clock = useGameClock(gate === "ok");

	useEffect(() => {
		if (!wasLoggedIn) {
			window.location.assign(loginHref({ redirectUri: "/hub" }));
			return;
		}
		setGate("ok");
	}, [loginHref, wasLoggedIn]);

	useEffect(() => {
		if (clock.status === "unauthenticated") {
			window.location.assign(loginHref({ redirectUri: "/hub" }));
		}
	}, [clock.status, loginHref]);

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

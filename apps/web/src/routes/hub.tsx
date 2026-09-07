import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { useAuth } from "@packages/auth/react";

import { isReturnHomeAfterLogout, POST_LOGOUT_PATH } from "../auth/after-logout";
import { useGameClock } from "../clock/use-game-clock";

const HubSession = lazy(async () => {
	const module = await import("../hub/hub-session");
	return { default: module.HubSession };
});

export const Route = createFileRoute("/hub")({
	component: HubPage,
});

export function PlayButton() {
	return <a href="/hub">Play</a>;
}

export function HubPage() {
	const { wasLoggedIn, loginHref } = useAuth();
	const [gate, setGate] = useState<"pending" | "ok">("pending");
	const clock = useGameClock(gate === "ok");

	useEffect(() => {
		if (!wasLoggedIn) {
			if (isReturnHomeAfterLogout()) {
				window.location.replace(POST_LOGOUT_PATH);
				return;
			}

			window.location.assign(loginHref({ redirectUri: "/hub" }));
			return;
		}
		setGate("ok");
	}, [loginHref, wasLoggedIn]);

	useEffect(() => {
		if (clock.status === "unauthenticated") {
			if (isReturnHomeAfterLogout()) {
				window.location.replace(POST_LOGOUT_PATH);
				return;
			}

			window.location.assign(loginHref({ redirectUri: "/hub" }));
		}
	}, [clock.status, loginHref]);

	if (gate !== "ok") {
		return (
			<main>
				<p>Loading...</p>
			</main>
		);
	}

	return (
		<Suspense
			fallback={
				<main>
					<p>Loading...</p>
				</main>
			}
		>
			<HubSession />
		</Suspense>
	);
}

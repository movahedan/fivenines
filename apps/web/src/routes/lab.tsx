import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { useAuth } from "@packages/auth/react";

const LabSession = lazy(async () => {
	const module = await import("../lab/lab-session");
	return { default: module.LabSession };
});

export const Route = createFileRoute("/lab")({
	component: LabPage,
});

export function LabPage() {
	const { wasLoggedIn, loginHref } = useAuth();
	const [gate, setGate] = useState<"pending" | "ok">("pending");

	useEffect(() => {
		if (!wasLoggedIn) {
			window.location.assign(loginHref({ redirectUri: "/lab" }));
			return;
		}

		setGate("ok");
	}, [loginHref, wasLoggedIn]);

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
			<LabSession />
		</Suspense>
	);
}

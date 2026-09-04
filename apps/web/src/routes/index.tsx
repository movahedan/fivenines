import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { healthControllerGetStatus } from "@packages/nestjs-sdk/server";

import { HomeStatus } from "../home/home-status";

const getControlPlaneHealth = createServerFn({ method: "GET" }).handler(async () => {
	try {
		const health = await healthControllerGetStatus();
		return { ok: health.ok, service: "nestjs" as const };
	} catch {
		return { ok: null, service: "nestjs" as const };
	}
});

export const Route = createFileRoute("/")({
	loader: () => getControlPlaneHealth(),
	component: HomePage,
});

function HomePage() {
	const { ok, service } = Route.useLoaderData();

	return (
		<main>
			<h1>Five Nines</h1>
			<HomeStatus ok={ok} service={service} />
		</main>
	);
}

import {
	createRootRoute,
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactElement } from "react";

import "@packages/ui/style.css";

function RootError({ error }: ErrorComponentProps) {
	const message = error instanceof Error ? error.message : String(error);

	return (
		<main className="min-h-screen bg-background p-8 font-sans text-foreground">
			<h1 className="text-lg font-semibold">Something went wrong</h1>
			<p className="mt-4 font-mono text-sm text-destructive">{message}</p>
		</main>
	);
}

function RootDocument(): ReactElement {
	return (
		<html lang="en" className="h-full bg-background">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-full bg-background font-sans text-foreground">
				<Outlet />
				<Scripts />
			</body>
		</html>
	);
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Five Nines" },
		],
	}),
	component: RootDocument,
	errorComponent: RootError,
	notFoundComponent: () => <p>Not found</p>,
});

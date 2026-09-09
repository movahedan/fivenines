import {
	createRootRoute,
	type ErrorComponentProps,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { useEffect } from "react";

import "@packages/ui/style.css";

import { bootstrapWebClient } from "./-bootstrap-web-client";

function RootError({ error }: ErrorComponentProps) {
	const message = error instanceof Error ? error.message : String(error);

	return (
		<main className="min-h-screen bg-background p-8 font-sans text-foreground">
			<h1 className="text-lg font-semibold">Something went wrong</h1>
			<p className="mt-4 font-mono text-sm text-destructive">{message}</p>
		</main>
	);
}

function RootShell({ children }: { readonly children: ReactNode }): ReactElement {
	return (
		<html lang="en" className="h-full bg-background">
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<meta content="#0b1220" name="theme-color" />
				<link href="/manifest.json" rel="manifest" />
				<link href="/logo192.png" rel="apple-touch-icon" />
				<link href="/silktide/silktide-consent-manager.css" rel="stylesheet" />
				<script src="/gtag-consent-default.js" />
				<HeadContent />
			</head>
			<body className="min-h-full bg-background font-sans text-foreground">
				<div id="root">{children}</div>
				<script defer src="/silktide/silktide-consent-manager.js" />
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent(): ReactElement {
	useEffect(() => {
		bootstrapWebClient();
	}, []);
	return <Outlet />;
}

export const Route = createRootRoute({
	shellComponent: RootShell,
	component: RootComponent,
	head: () => ({
		meta: [{ title: "Five Nines" }],
	}),
	errorComponent: RootError,
	notFoundComponent: () => <p>Not found</p>,
});

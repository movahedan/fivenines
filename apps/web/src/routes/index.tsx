import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "../site/home/home-page";
import { siteHead } from "../site/site-head";

export const Route = createFileRoute("/")({
	ssr: false,
	head: () =>
		siteHead({
			title: "Five Nines",
			description: "Cloud tycoon ops console. Play at /hub — capacity, contracts, cash, and SLA.",
			path: "/",
		}),
	component: HomePage,
});

import { createFileRoute } from "@tanstack/react-router";

import { AboutPage } from "../site/about-page";
import { siteHead } from "../site/site-head";

export const Route = createFileRoute("/about")({
	head: () =>
		siteHead({
			title: "About · Five Nines",
			description: "Studio notes for Five Nines, the cloud tycoon. Wiki and source links.",
			path: "/about",
		}),
	component: AboutPage,
});

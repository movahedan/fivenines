import { createFileRoute } from "@tanstack/react-router";

import { ContactPage } from "../site/contact-page";
import { siteHead } from "../site/site-head";

export const Route = createFileRoute("/contact")({
	ssr: false,
	head: () =>
		siteHead({
			title: "Contact · Five Nines",
			description: "Mailto, GitHub, and wiki. No contact form.",
			path: "/contact",
		}),
	component: ContactPage,
});

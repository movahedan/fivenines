import { createFileRoute } from "@tanstack/react-router";

import { siteHead } from "../site/site-head";
import { TermsPage } from "../site/terms-page";

export const Route = createFileRoute("/terms")({
	head: () =>
		siteHead({
			title: "Terms · Five Nines",
			description: "Placeholder terms for the Five Nines game. Not a complete legal agreement.",
			path: "/terms",
		}),
	component: TermsPage,
});

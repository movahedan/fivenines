import { createFileRoute } from "@tanstack/react-router";

import { CookiePolicyPage } from "../site/cookie-policy-page";
import { siteHead } from "../site/site-head";

export const Route = createFileRoute("/cookie-policy")({
	head: () =>
		siteHead({
			title: "Cookie policy · Five Nines",
			description: "Placeholder cookie policy. Analytics tags wait for consent.",
			path: "/cookie-policy",
		}),
	component: CookiePolicyPage,
});

import { createFileRoute } from "@tanstack/react-router";

import { PrivacyPage } from "../site/privacy-page";
import { siteHead } from "../site/site-head";

export const Route = createFileRoute("/privacy")({
	ssr: false,
	head: () =>
		siteHead({
			title: "Privacy · Five Nines",
			description:
				"Placeholder privacy policy. We will describe collection when player accounts exist.",
			path: "/privacy",
		}),
	component: PrivacyPage,
});

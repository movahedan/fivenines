import { createFileRoute } from "@tanstack/react-router";

import { SitePage, SiteParagraph } from "../components/site-page";
import { pageHead } from "./-page-head";

function PrivacyPage() {
	return (
		<SitePage title="Privacy">
			<SiteParagraph>
				This is a placeholder. We do not run a production account database for Five Nines yet. When
				we do, this page will say what we collect, why, and for how long.
			</SiteParagraph>
			<SiteParagraph>
				Today the play routes may send session cookies to the auth app and clock health checks to
				the API. Marketing pages do not restore a session. Analytics tags load only after you accept
				analytics cookies (when a GTM container is configured).
			</SiteParagraph>
		</SitePage>
	);
}

export const Route = createFileRoute("/privacy")({
	ssr: false,
	head: () =>
		pageHead({
			title: "Privacy · Five Nines",
			description:
				"Placeholder privacy policy. We will describe collection when player accounts exist.",
			path: "/privacy",
		}),
	component: PrivacyPage,
});

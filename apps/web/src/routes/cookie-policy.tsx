import { createFileRoute } from "@tanstack/react-router";

import { ManageCookiesButton } from "../components/manage-cookies-button";
import { SitePage, SiteParagraph } from "../components/site-page";
import { pageHead } from "./-page-head";

function CookiePolicyPage() {
	return (
		<SitePage title="Cookie policy">
			<SiteParagraph>
				This is a placeholder. Essential cookies keep the site and sign-in working. Analytics and
				marketing cookies are optional. We load Google Tag Manager only after analytics consent, and
				only when a container id is set for a production build — not during local `bun run dev`.
			</SiteParagraph>
			<p>
				<ManageCookiesButton className="underline" />
			</p>
		</SitePage>
	);
}

export const Route = createFileRoute("/cookie-policy")({
	ssr: false,
	head: () =>
		pageHead({
			title: "Cookie policy · Five Nines",
			description: "Placeholder cookie policy. Analytics tags wait for consent.",
			path: "/cookie-policy",
		}),
	component: CookiePolicyPage,
});

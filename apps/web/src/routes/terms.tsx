import { createFileRoute } from "@tanstack/react-router";

import { SitePage, SiteParagraph } from "../components/site-page";
import { pageHead } from "./-page-head";

function TermsPage() {
	return (
		<SitePage title="Terms">
			<SiteParagraph>
				This is a placeholder, not a complete terms of service. Five Nines is a noncommercial game
				project. Play is offered as-is while the kernel and ops console are still changing.
			</SiteParagraph>
			<SiteParagraph>
				Do not treat scores, cash, or SLA digits as a live billing product. The license is PolyForm
				Noncommercial 1.0.0.
			</SiteParagraph>
		</SitePage>
	);
}

export const Route = createFileRoute("/terms")({
	ssr: false,
	head: () =>
		pageHead({
			title: "Terms · Five Nines",
			description: "Placeholder terms for the Five Nines game. Not a complete legal agreement.",
			path: "/terms",
		}),
	component: TermsPage,
});

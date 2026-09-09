import { createFileRoute } from "@tanstack/react-router";

import { CONTACT_MAILTO, GITHUB_URL, WIKI_URL } from "../components/site-links";
import { SitePage, SiteParagraph } from "../components/site-page";
import { pageHead } from "./-page-head";

function ContactPage() {
	return (
		<SitePage title="Contact">
			<SiteParagraph>There is no contact form. Reach us here:</SiteParagraph>
			<ul className="list-disc space-y-2 pl-5 text-muted-foreground">
				<li>
					<a className="underline" href={CONTACT_MAILTO}>
						hello@fivenines.com
					</a>
				</li>
				<li>
					<a className="underline" href={GITHUB_URL} rel="noreferrer" target="_blank">
						GitHub
					</a>
				</li>
				<li>
					<a className="underline" href={WIKI_URL} rel="noreferrer" target="_blank">
						Wiki
					</a>
				</li>
			</ul>
		</SitePage>
	);
}

export const Route = createFileRoute("/contact")({
	ssr: false,
	head: () =>
		pageHead({
			title: "Contact · Five Nines",
			description: "Mailto, GitHub, and wiki. No contact form.",
			path: "/contact",
		}),
	component: ContactPage,
});

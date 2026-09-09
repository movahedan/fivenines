import { createFileRoute } from "@tanstack/react-router";

import { GITHUB_URL, WIKI_URL } from "../components/site-links";
import { SitePage, SiteParagraph } from "../components/site-page";
import { pageHead } from "./-page-head";

function AboutPage() {
	return (
		<SitePage title="About">
			<SiteParagraph>
				Five Nines is a studio project: a cloud tycoon whose physics live in one kernel. The hub is
				the player ops console. The wiki is the public pitch. This page is not a company brochure.
			</SiteParagraph>
			<SiteParagraph>
				<a className="underline" href={WIKI_URL} rel="noreferrer" target="_blank">
					Read the wiki
				</a>
				{" · "}
				<a className="underline" href={GITHUB_URL} rel="noreferrer" target="_blank">
					Source on GitHub
				</a>
			</SiteParagraph>
		</SitePage>
	);
}

export const Route = createFileRoute("/about")({
	ssr: false,
	head: () =>
		pageHead({
			title: "About · Five Nines",
			description: "Studio notes for Five Nines, the cloud tycoon. Wiki and source links.",
			path: "/about",
		}),
	component: AboutPage,
});

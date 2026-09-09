import type { ReactElement } from "react";

import { GITHUB_URL, WIKI_URL } from "./site-links";
import { SitePage, SiteParagraph } from "./site-page";

export function AboutPage(): ReactElement {
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

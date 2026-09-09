import type { ReactElement } from "react";

import { CONTACT_MAILTO, GITHUB_URL, WIKI_URL } from "./site-links";
import { SitePage, SiteParagraph } from "./site-page";

export function ContactPage(): ReactElement {
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

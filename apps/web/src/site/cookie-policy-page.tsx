import type { ReactElement } from "react";

import { SitePage, SiteParagraph } from "./site-page";

export function CookiePolicyPage(): ReactElement {
	return (
		<SitePage title="Cookie policy">
			<SiteParagraph>
				This is a placeholder. Essential cookies keep the site and sign-in working. Analytics and
				marketing cookies are optional. We load Google Tag Manager only after analytics consent, and
				only when a container id is set for a production build — not during local `bun run dev`.
			</SiteParagraph>
			<p>
				<button
					className="underline"
					onClick={() => {
						void import("@packages/analytics").then((mod) => {
							mod.openCookiePreferences();
						});
					}}
					type="button"
				>
					Manage cookies
				</button>
			</p>
		</SitePage>
	);
}

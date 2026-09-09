import type { ReactElement } from "react";

import { SitePage, SiteParagraph } from "./site-page";

export function TermsPage(): ReactElement {
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

import type { ReactElement, ReactNode } from "react";

import { SiteChrome } from "./site-chrome";

export function SitePage({
	children,
	title,
}: {
	readonly children: ReactNode;
	readonly title: string;
}): ReactElement {
	return (
		<SiteChrome>
			<article className="prose-none max-w-3xl space-y-4">
				<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
				{children}
			</article>
		</SiteChrome>
	);
}

export function SiteParagraph({ children }: { readonly children: ReactNode }): ReactElement {
	return <p className="text-base leading-7 text-muted-foreground">{children}</p>;
}

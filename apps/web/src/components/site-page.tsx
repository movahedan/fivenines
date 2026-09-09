import type { ReactNode } from "react";

import { SiteChrome } from "./site-chrome";

interface SitePageProps {
	readonly children: ReactNode;
	readonly title: string;
}

export function SitePage({ children, title }: SitePageProps) {
	return (
		<SiteChrome>
			<article className="prose-none max-w-3xl space-y-4">
				<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
				{children}
			</article>
		</SiteChrome>
	);
}

interface SiteParagraphProps {
	readonly children: ReactNode;
}

export function SiteParagraph({ children }: SiteParagraphProps) {
	return <p className="text-base leading-7 text-muted-foreground">{children}</p>;
}

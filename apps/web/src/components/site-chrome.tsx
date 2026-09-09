import type { ReactNode } from "react";

import { ManageCookiesButton } from "./manage-cookies-button";
import { GITHUB_URL, WIKI_URL } from "./site-links";

const NAV = [
	{ href: "/", label: "Home" },
	{ href: "/about", label: "About" },
	{ href: "/contact", label: "Contact" },
] as const;

const FOOTER = [
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
	{ href: "/cookie-policy", label: "Cookies" },
	{ href: "/contact", label: "Contact" },
] as const;

interface SiteChromeProps {
	readonly children: ReactNode;
}

export function SiteChrome({ children }: SiteChromeProps) {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<header className="border-b border-border px-6 py-4">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
					<a className="text-lg font-semibold tracking-tight" href="/">
						Five Nines
					</a>
					<nav aria-label="Site" className="flex flex-wrap items-center gap-4 text-sm">
						{NAV.map((item) => (
							<a className="hover:underline" href={item.href} key={item.href}>
								{item.label}
							</a>
						))}
						<a
							className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground"
							href="/hub"
						>
							Play
						</a>
					</nav>
				</div>
			</header>
			<div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</div>
			<footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
				<div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<nav aria-label="Legal" className="flex flex-wrap gap-4">
						{FOOTER.map((item) => (
							<a className="hover:underline" href={item.href} key={item.href}>
								{item.label}
							</a>
						))}
						<ManageCookiesButton className="hover:underline" />
					</nav>
					<div className="flex flex-wrap gap-4">
						<a className="hover:underline" href={GITHUB_URL} rel="noreferrer" target="_blank">
							GitHub
						</a>
						<a className="hover:underline" href={WIKI_URL} rel="noreferrer" target="_blank">
							Wiki
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

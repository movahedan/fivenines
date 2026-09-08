import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	children: ReactNode;
	newTab?: boolean;
	href: string;
}

export function Link({ children, href, newTab, className, ...other }: Readonly<LinkProps>) {
	return (
		<a
			className={cn(
				"font-medium text-info underline-offset-4 transition-colors hover:text-primary hover:underline",
				className,
			)}
			href={href}
			rel={newTab ? "noreferrer" : undefined}
			target={newTab ? "_blank" : undefined}
			{...other}
		>
			{children}
		</a>
	);
}

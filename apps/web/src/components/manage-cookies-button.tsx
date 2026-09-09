interface ManageCookiesButtonProps {
	readonly className?: string;
}

export function ManageCookiesButton({ className }: ManageCookiesButtonProps) {
	return (
		<button
			className={className}
			onClick={() => {
				void import("@packages/analytics").then((mod) => {
					mod.openCookiePreferences();
				});
			}}
			type="button"
		>
			Manage cookies
		</button>
	);
}

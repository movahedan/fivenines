export const THEME = {
	light: {
		background: "oklch(1 0 0)",
		foreground: "oklch(0.145 0 0)",
		card: "oklch(1 0 0)",
		cardForeground: "oklch(0.145 0 0)",
		popover: "oklch(1 0 0)",
		popoverForeground: "oklch(0.145 0 0)",
		primary: "oklch(0.205 0 0)",
		primaryForeground: "oklch(0.985 0 0)",
		secondary: "oklch(0.97 0 0)",
		secondaryForeground: "oklch(0.205 0 0)",
		muted: "oklch(0.97 0 0)",
		mutedForeground: "oklch(0.556 0 0)",
		accent: "oklch(0.97 0 0)",
		accentForeground: "oklch(0.205 0 0)",
		destructive: "oklch(0.577 0.245 27.325)",
		border: "oklch(0.922 0 0)",
		input: "oklch(0.922 0 0)",
		ring: "oklch(0.708 0 0)",
		radius: "0.625rem",
		chart1: "oklch(0.646 0.222 41.116)",
		chart2: "oklch(0.6 0.118 184.704)",
		chart3: "oklch(0.398 0.07 227.392)",
		chart4: "oklch(0.828 0.189 84.429)",
		chart5: "oklch(0.769 0.188 70.08)",
	},
	dark: {
		background: "oklch(0.145 0 0)",
		foreground: "oklch(0.985 0 0)",
		card: "oklch(0.145 0 0)",
		cardForeground: "oklch(0.985 0 0)",
		popover: "oklch(0.145 0 0)",
		popoverForeground: "oklch(0.985 0 0)",
		primary: "oklch(0.985 0 0)",
		primaryForeground: "oklch(0.205 0 0)",
		secondary: "oklch(0.269 0 0)",
		secondaryForeground: "oklch(0.985 0 0)",
		muted: "oklch(0.269 0 0)",
		mutedForeground: "oklch(0.708 0 0)",
		accent: "oklch(0.269 0 0)",
		accentForeground: "oklch(0.985 0 0)",
		destructive: "oklch(0.396 0.141 25.723)",
		border: "oklch(0.269 0 0)",
		input: "oklch(0.269 0 0)",
		ring: "oklch(0.439 0 0)",
		radius: "0.625rem",
		chart1: "oklch(0.488 0.243 264.376)",
		chart2: "oklch(0.696 0.17 162.48)",
		chart3: "oklch(0.769 0.188 70.08)",
		chart4: "oklch(0.627 0.265 303.9)",
		chart5: "oklch(0.645 0.246 16.439)",
	},
} as const;

interface NavigationTheme {
	readonly dark: boolean;
	readonly colors: {
		readonly background: string;
		readonly border: string;
		readonly card: string;
		readonly notification: string;
		readonly primary: string;
		readonly text: string;
	};
}

export const NAV_THEME: Record<"light" | "dark", NavigationTheme> = {
	light: {
		dark: false,
		colors: {
			background: THEME.light.background,
			border: THEME.light.border,
			card: THEME.light.card,
			notification: THEME.light.destructive,
			primary: THEME.light.primary,
			text: THEME.light.foreground,
		},
	},
	dark: {
		dark: true,
		colors: {
			background: THEME.dark.background,
			border: THEME.dark.border,
			card: THEME.dark.card,
			notification: THEME.dark.destructive,
			primary: THEME.dark.primary,
			text: THEME.dark.foreground,
		},
	},
};

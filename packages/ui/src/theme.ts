const OPS = {
	background: "#050912",
	foreground: "#e2e8f0",
	card: "#0a1228",
	cardForeground: "#e2e8f0",
	popover: "#0a1228",
	popoverForeground: "#e2e8f0",
	primary: "#00ff88",
	primaryForeground: "#050912",
	secondary: "#060c1e",
	secondaryForeground: "#e2e8f0",
	muted: "#0a1228",
	mutedForeground: "#64748b",
	accent: "#0a1228",
	accentForeground: "#00ff88",
	destructive: "#f87171",
	border: "#1e3a5f",
	input: "#1e3a5f",
	ring: "#00ff88",
	radius: "0.625rem",
	chart1: "#00ff88",
	chart2: "#60a5fa",
	chart3: "#fbbf24",
	chart4: "#f87171",
	chart5: "#64748b",
	hud: "#060c1e",
	panel: "#081428",
	warning: "#fbbf24",
	info: "#60a5fa",
	sla: "#4ade80",
} as const;

export const THEME = {
	light: OPS,
	dark: OPS,
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

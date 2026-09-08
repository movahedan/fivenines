import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export type PanelHeaderTone = "primary" | "warning" | "info" | "destructive";

export interface PanelHeaderProps {
	readonly label: string;
	readonly count?: number;
	readonly tone?: PanelHeaderTone;
	readonly trailing?: ReactNode;
	readonly className?: string;
}

const PANEL_DOT_CLASS = {
	primary: "bg-primary shadow-glow-primary",
	warning: "bg-warning shadow-glow-warning",
	info: "bg-info shadow-glow-info",
	destructive: "bg-destructive shadow-glow-danger",
} as const;

function panelDotClass(tone: PanelHeaderTone = "primary"): string {
	return PANEL_DOT_CLASS[tone];
}

function PanelHeader({ label, count, tone = "primary", trailing, className }: PanelHeaderProps) {
	return (
		<View
			className={cn(
				"flex-row items-center gap-2 border-b border-border bg-hud px-3 py-2 font-mono",
				className,
			)}
		>
			<View
				accessibilityLabel={`${tone} panel marker`}
				className={cn("h-1.5 w-1.5 rounded-full", panelDotClass(tone))}
			/>
			<Text className="flex-1 text-xs uppercase tracking-widest text-muted-foreground">
				{count === undefined ? label : `${label} (${count})`}
			</Text>
			{trailing}
		</View>
	);
}

export { PanelHeader };

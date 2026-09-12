import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export type MetricTone = "default" | "primary" | "warning" | "destructive" | "info";

export interface MetricStatProps {
	readonly label: string;
	readonly value: string;
	readonly tone?: MetricTone;
	readonly compact?: boolean;
	readonly className?: string;
}

const METRIC_TONE_CLASS = {
	default: "text-foreground",
	primary: "text-primary",
	warning: "text-warning",
	destructive: "text-destructive",
	info: "text-info",
} as const;

export function metricToneClass(tone: MetricTone = "default"): string {
	return METRIC_TONE_CLASS[tone];
}

function MetricStat({
	label,
	value,
	tone = "default",
	compact = false,
	className,
}: MetricStatProps) {
	return (
		<View className={cn("flex-col", compact ? "gap-px" : "gap-0.5", className)}>
			<Text
				className={cn(
					"font-bold tracking-wider text-muted-foreground",
					compact ? "text-[8px]" : "text-[9px]",
				)}
			>
				{label}
			</Text>
			<Text
				className={cn(
					"font-mono font-bold leading-none",
					compact ? "text-xs" : "text-sm",
					metricToneClass(tone),
				)}
			>
				{value}
			</Text>
		</View>
	);
}

export { MetricStat };

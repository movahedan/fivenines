import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export type MetricTone = "default" | "primary" | "warning" | "destructive" | "info";

export interface MetricStatProps {
	readonly label: string;
	readonly value: string;
	readonly tone?: MetricTone;
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

function MetricStat({ label, value, tone = "default", className }: MetricStatProps) {
	return (
		<View className={cn("flex-col gap-0.5", className)}>
			<Text className="font-mono text-xs text-muted-foreground">{label}</Text>
			<Text className={cn("font-mono font-semibold", metricToneClass(tone))}>{value}</Text>
		</View>
	);
}

export { MetricStat };

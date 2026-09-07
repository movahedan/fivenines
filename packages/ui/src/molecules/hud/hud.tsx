import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";
import { Button } from "../button/button";
import { MetricStat, type MetricTone } from "../metric-stat/metric-stat";

export interface HudMetric {
	readonly label: string;
	readonly value: string;
	readonly tone?: MetricTone;
}

export interface HudProps {
	readonly title: string;
	readonly subtitle?: string;
	readonly tickLabel: string;
	readonly clockLabel?: string;
	readonly metrics: readonly HudMetric[];
	readonly running: boolean;
	readonly jailed?: boolean;
	readonly onToggleRunning: () => void;
	readonly account?: ReactNode;
	readonly className?: string;
}

function Hud({
	title,
	subtitle,
	tickLabel,
	clockLabel,
	metrics,
	running,
	jailed,
	onToggleRunning,
	account,
	className,
}: HudProps) {
	return (
		<View
			className={cn(
				"flex-row items-center justify-between gap-4 border-b border-border bg-hud px-4 py-2 font-mono",
				className,
			)}
		>
			<View className="flex-row items-center gap-3">
				<View className="h-6 w-6 bg-primary" />
				<View className="flex-col">
					<Text className="text-sm font-semibold text-foreground">{title}</Text>
					{subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
				</View>
			</View>

			<View className="flex-row items-center gap-6">
				<View className="flex-col items-center">
					<Text className="text-sm font-semibold text-foreground">{tickLabel}</Text>
					{clockLabel ? <Text className="text-xs text-muted-foreground">{clockLabel}</Text> : null}
				</View>
				<View className="flex-row items-center gap-4">
					{metrics.map((metric) => (
						<MetricStat
							key={metric.label}
							label={metric.label}
							value={metric.value}
							tone={metric.tone}
						/>
					))}
				</View>
			</View>

			<View className="flex-row items-center gap-3">
				<Button size="sm" variant="outline" onClick={onToggleRunning}>
					{running ? "Pause" : "Resume"}
				</Button>
				{jailed ? <Text className="text-xs font-semibold text-destructive">JAILED</Text> : null}
				{account}
			</View>
		</View>
	);
}

export { Hud };

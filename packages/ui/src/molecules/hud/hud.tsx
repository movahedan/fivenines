import { Pause, Play } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils";
import { Button } from "../../atoms/button";
import { Icon } from "../../atoms/icon";
import { Text } from "../../atoms/text";
import { MetricStat, type MetricTone } from "../metric-stat/metric-stat";

export const HUD_TICK_SPEEDS = [1, 2, 4] as const;

export type HudTickSpeed = (typeof HUD_TICK_SPEEDS)[number];

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
	readonly speed?: HudTickSpeed;
	readonly onSpeedChange?: (speed: HudTickSpeed) => void;
	readonly account?: ReactNode;
	readonly logo?: ReactNode;
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
	speed = 1,
	onSpeedChange,
	account,
	logo,
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
				{logo ?? (
					<View
						accessibilityLabel="Five Nines mark"
						className="h-8 w-8 items-center justify-center rounded-md bg-primary shadow-glow-primary"
					>
						<Text className="font-mono text-[11px] font-bold tracking-tighter text-primary-foreground">
							9s
						</Text>
					</View>
				)}
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

			<View className="flex-row items-center gap-2">
				<Button
					accessibilityLabel={running ? "Pause" : "Play"}
					size="icon"
					variant="outline"
					onClick={onToggleRunning}
				>
					<Icon as={running ? Pause : Play} size={16} />
				</Button>
				{HUD_TICK_SPEEDS.map((tickSpeed) => (
					<Button
						accessibilityLabel={`Speed ×${String(tickSpeed)}`}
						key={tickSpeed}
						size="icon"
						variant={speed === tickSpeed ? "default" : "outline"}
						onClick={() => {
							onSpeedChange?.(tickSpeed);
						}}
					>
						×{tickSpeed}
					</Button>
				))}
				{jailed ? <Text className="text-xs font-semibold text-destructive">JAILED</Text> : null}
				{account}
			</View>
		</View>
	);
}

export { Hud };

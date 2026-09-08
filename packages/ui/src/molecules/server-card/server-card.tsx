import { View } from "react-native";

import { cn } from "@/utils";
import { Button } from "../../atoms/button";
import { Card } from "../../atoms/card";
import { Text } from "../../atoms/text";
import { MetricStat } from "../metric-stat/metric-stat";

const FLEET_AXIS_BLOCKS = 16;

const UTIL_FILL_CLASS = {
	primary: "bg-primary",
	warning: "bg-warning",
	destructive: "bg-destructive",
} as const;

type UtilTone = keyof typeof UTIL_FILL_CLASS;

export interface ServerCardProps {
	readonly variant: "fleet" | "market";
	readonly label: string;
	readonly idLabel?: string;
	readonly cpuLabel: string;
	readonly ramLabel?: string;
	readonly netLabel?: string;
	readonly opexLabel: string;
	readonly costLabel?: string;
	readonly cpuPercent?: number;
	readonly netPercent?: number;
	readonly ramPercent?: number;
	readonly canAfford?: boolean;
	readonly onSell?: () => void;
	readonly onBuy?: () => void;
	readonly className?: string;
}

export function ServerCard({
	variant,
	label,
	idLabel,
	cpuLabel,
	ramLabel,
	netLabel,
	opexLabel,
	costLabel,
	cpuPercent,
	netPercent,
	ramPercent,
	canAfford,
	onSell,
	onBuy,
	className,
}: ServerCardProps) {
	const unaffordable = variant === "market" && canAfford === false;

	if (variant === "market") {
		return (
			<Card className={cn("gap-2 p-3", unaffordable && "opacity-60", className)}>
				<Text className="font-mono text-sm font-bold text-card-foreground">{label}</Text>
				<View className="flex-row flex-wrap gap-x-2 gap-y-1">
					{costLabel ? (
						<MetricStat className="w-1/2" label="COST" tone="warning" value={costLabel} />
					) : null}
					<MetricStat className="w-1/2" label="OPEX" tone="destructive" value={opexLabel} />
					<MetricStat className="w-1/2" label="CPU" tone="info" value={cpuLabel} />
					{ramLabel ? (
						<MetricStat className="w-1/2" label="RAM" tone="info" value={ramLabel} />
					) : null}
				</View>
				{onBuy ? (
					<Button className="w-full" disabled={unaffordable} onClick={onBuy} size="sm">
						BUY
					</Button>
				) : null}
			</Card>
		);
	}

	return (
		<Card className={cn("gap-2 p-3", className)}>
			<View className="flex-row items-center justify-between gap-2">
				<View className="min-w-0 flex-1 flex-row items-center gap-1.5">
					<Text className="font-mono text-sm font-semibold text-card-foreground">{label}</Text>
					{idLabel ? (
						<Text className="font-mono text-xs text-muted-foreground">{idLabel}</Text>
					) : null}
				</View>
				{onSell ? (
					<Button className="text-destructive" onClick={onSell} size="sm" variant="ghost">
						SELL
					</Button>
				) : null}
			</View>
			<FleetAxis capLabel={cpuLabel} name="CPU" percent={cpuPercent ?? 0} />
			<FleetAxis capLabel={netLabel} name="NET" percent={netPercent ?? 0} />
			<FleetAxis capLabel={ramLabel} name="RAM" percent={ramPercent ?? 0} />
			<Text className="font-mono text-xs text-muted-foreground">{opexLabel}</Text>
		</Card>
	);
}

interface FleetAxisProps {
	readonly name: string;
	readonly capLabel?: string;
	readonly percent: number;
}

function FleetAxis({ name, capLabel, percent }: FleetAxisProps) {
	const tone = utilToneFromPercent(percent);
	const filledCount = Math.min(
		FLEET_AXIS_BLOCKS,
		Math.max(0, Math.round((percent / 100) * FLEET_AXIS_BLOCKS)),
	);

	return (
		<View accessibilityLabel={`${name} ${String(Math.round(percent))} percent`} className="gap-1">
			<View className="flex-row items-center justify-between gap-2">
				<View className="min-w-0 flex-1 flex-row items-baseline gap-1.5">
					<Text className="font-mono text-xs text-muted-foreground">{name}</Text>
					{capLabel ? (
						<Text className="font-mono text-xs text-muted-foreground">{capLabel}</Text>
					) : null}
				</View>
				<Text className={cn("font-mono text-xs", utilTextClass(tone))}>
					{`${String(Math.round(percent))}%`}
				</Text>
			</View>
			<View className="flex-row gap-0.5">
				{Array.from({ length: FLEET_AXIS_BLOCKS }, (_, index) => (
					<View
						className={cn(
							"h-2 flex-1 rounded-sm",
							index < filledCount ? UTIL_FILL_CLASS[tone] : "bg-muted",
						)}
						key={`${name}-${index.toString()}`}
					/>
				))}
			</View>
		</View>
	);
}

function utilToneFromPercent(percent: number): UtilTone {
	if (percent >= 90) {
		return "destructive";
	}

	if (percent >= 70) {
		return "warning";
	}

	return "primary";
}

function utilTextClass(tone: UtilTone): string {
	if (tone === "warning") {
		return "text-warning";
	}
	if (tone === "destructive") {
		return "text-destructive";
	}
	return "text-primary";
}

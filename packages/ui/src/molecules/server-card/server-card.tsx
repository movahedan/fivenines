import { View } from "react-native";

import { cn } from "@/utils";
import { Card } from "../../atoms/card";
import { Text } from "../../atoms/text";
import { Button } from "../button/button";
import { MetricStat } from "../metric-stat/metric-stat";

const FLEET_CPU_BLOCKS = 16;

const UTIL_FILL_CLASS = {
	primary: "bg-primary",
	warning: "bg-warning",
	destructive: "bg-destructive",
} as const;

export interface ServerCardProps {
	readonly variant: "fleet" | "market";
	readonly label: string;
	readonly idLabel?: string;
	readonly cpuLabel: string;
	readonly ramLabel?: string;
	readonly opexLabel: string;
	readonly costLabel?: string;
	readonly utilPercent?: number;
	readonly utilTone?: keyof typeof UTIL_FILL_CLASS;
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
	opexLabel,
	costLabel,
	utilPercent,
	utilTone = "primary",
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

	const filledCount = Math.min(
		FLEET_CPU_BLOCKS,
		Math.max(0, Math.round(((utilPercent ?? 0) / 100) * FLEET_CPU_BLOCKS)),
	);

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
			<View className="gap-1">
				<View className="flex-row items-center justify-between">
					<Text className="font-mono text-xs text-muted-foreground">{cpuLabel}</Text>
					{utilPercent === undefined ? null : (
						<Text className={cn("font-mono text-xs", utilTextClass(utilTone))}>
							{`${Math.round(utilPercent)}%`}
						</Text>
					)}
				</View>
				<View className="flex-row gap-0.5">
					{Array.from({ length: FLEET_CPU_BLOCKS }, (_, index) => (
						<View
							className={cn(
								"h-2 flex-1 rounded-sm",
								index < filledCount ? UTIL_FILL_CLASS[utilTone] : "bg-muted",
							)}
							key={`cpu-${index.toString()}`}
						/>
					))}
				</View>
			</View>
			<Text className="font-mono text-xs text-muted-foreground">{opexLabel}</Text>
		</Card>
	);
}

function utilTextClass(tone: keyof typeof UTIL_FILL_CLASS): string {
	if (tone === "warning") {
		return "text-warning";
	}
	if (tone === "destructive") {
		return "text-destructive";
	}
	return "text-primary";
}

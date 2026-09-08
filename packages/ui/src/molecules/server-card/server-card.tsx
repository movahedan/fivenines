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
	readonly canAffordLease?: boolean;
	readonly leaseLabel?: string;
	readonly onSell?: () => void;
	readonly onRelease?: () => void;
	readonly onBuy?: () => void;
	readonly onLease?: () => void;
	readonly dotClassName?: string;
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
	canAffordLease,
	leaseLabel,
	onSell,
	onRelease,
	onBuy,
	onLease,
	dotClassName,
	className,
}: ServerCardProps) {
	const buyDisabled = canAfford === false;
	const leaseDisabled = canAffordLease === false;
	const marketMuted =
		variant === "market" &&
		(onBuy === undefined || buyDisabled) &&
		(onLease === undefined || leaseDisabled);
	const skuDot = <SkuDot className={dotClassName} />;
	const statWidth = leaseLabel === undefined ? "w-1/2" : "min-w-0 flex-1";

	if (variant === "market") {
		return (
			<Card className={cn("gap-2 p-3", marketMuted && "opacity-60", className)}>
				<View className="flex-row items-center gap-1.5">
					{skuDot}
					<Text className="font-mono text-sm font-bold text-card-foreground">{label}</Text>
				</View>
				<View className="flex-row flex-wrap gap-x-2 gap-y-1">
					<MetricStat className={statWidth} label="CPU" tone="info" value={cpuLabel} />
					{ramLabel ? (
						<MetricStat className={statWidth} label="RAM" tone="info" value={ramLabel} />
					) : null}
				</View>
				<View className="flex-row flex-wrap gap-x-2 gap-y-1">
					{costLabel ? (
						<MetricStat className={statWidth} label="COST" tone="warning" value={costLabel} />
					) : null}
					{opexLabel ? (
						<MetricStat className={statWidth} label="OPEX" tone="destructive" value={opexLabel} />
					) : null}
					{leaseLabel ? (
						<MetricStat className={statWidth} label="RENT" tone="warning" value={leaseLabel} />
					) : null}
				</View>

				{onBuy || onLease ? (
					<View className="flex-row gap-1.5">
						{onBuy ? (
							<Button className="min-w-0 flex-1" disabled={buyDisabled} onClick={onBuy} size="sm">
								BUY
							</Button>
						) : null}
						{onLease ? (
							<Button
								className="min-w-0 flex-1"
								disabled={leaseDisabled}
								onClick={onLease}
								size="sm"
								variant="outline"
							>
								LEASE
							</Button>
						) : null}
					</View>
				) : null}
			</Card>
		);
	}

	return (
		<Card className={cn("gap-2 p-3", className)}>
			<View className="flex-row items-center justify-between gap-2">
				<View className="min-w-0 flex-1 flex-row items-center gap-1.5">
					{skuDot}
					<Text className="font-mono text-sm font-semibold text-card-foreground">{label}</Text>
					{idLabel ? (
						<Text className="font-mono text-xs text-muted-foreground">{idLabel}</Text>
					) : null}
				</View>
				{onRelease ? (
					<Button className="text-destructive" onClick={onRelease} size="sm" variant="ghost">
						RELEASE
					</Button>
				) : onSell ? (
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

interface SkuDotProps {
	readonly className?: string;
}

function SkuDot({ className }: SkuDotProps) {
	return (
		<View
			accessibilityLabel="SKU marker"
			className={cn("h-2 w-2 shrink-0 rounded-full bg-info shadow-glow-info", className)}
			testID={className === undefined ? "sku-marker" : "sku-marker-custom"}
		/>
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

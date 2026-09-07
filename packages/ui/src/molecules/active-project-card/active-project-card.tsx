import { View } from "react-native";

import { cn } from "@/utils";
import { Card } from "../../atoms/card";
import { Progress } from "../../atoms/progress";
import { Text } from "../../atoms/text";

const SLA_INDICATOR_CLASS = {
	primary: "bg-primary",
	warning: "bg-warning",
	destructive: "bg-destructive",
	sla: "bg-sla",
} as const;

export interface ActiveProjectCardProps {
	readonly customerName: string;
	readonly name: string;
	readonly regionLabel: string;
	readonly regionClassName?: string;
	readonly slaLabel: string;
	readonly slaStatusLabel: string;
	readonly slaTone?: keyof typeof SLA_INDICATOR_CLASS;
	readonly slaPercent: number;
	readonly sparkline: readonly number[];
	readonly sparklineWarmingLabel?: string;
	readonly serverLabel: string;
	readonly paygLabel: string;
	readonly className?: string;
}

export function ActiveProjectCard({
	customerName,
	name,
	regionLabel,
	regionClassName,
	slaLabel,
	slaStatusLabel,
	slaTone = "primary",
	slaPercent,
	sparkline,
	sparklineWarmingLabel,
	serverLabel,
	paygLabel,
	className,
}: ActiveProjectCardProps) {
	const hasSparkline = sparkline.length > 0;

	return (
		<Card className={cn("gap-2 p-3", className)}>
			<View className="flex-row items-start justify-between gap-2">
				<View className="min-w-0 flex-1">
					<Text className="font-mono text-xs tracking-wide text-muted-foreground">
						{customerName}
					</Text>
					<Text className="font-mono text-sm font-semibold leading-tight text-card-foreground">
						{name}
					</Text>
				</View>
				<Text
					className={cn(
						"rounded-full px-1.5 py-0.5 font-mono text-xs font-bold tracking-wide",
						regionClassName,
					)}
				>
					{regionLabel}
				</Text>
			</View>
			<View className="gap-1">
				<View className="flex-row items-center justify-between">
					<Text className="font-mono text-xs text-muted-foreground">SLA</Text>
					<Text className={cn("font-mono text-xs font-semibold", slaStatusClass(slaTone))}>
						{slaLabel} · {slaStatusLabel}
					</Text>
				</View>
				<Progress indicatorClassName={SLA_INDICATOR_CLASS[slaTone]} value={slaPercent} />
			</View>
			<View className="h-6 flex-row items-end gap-px">
				{hasSparkline ? (
					sparkline.map((value, index) => (
						<View
							className={cn("flex-1 rounded-sm", value < 0.5 ? "bg-destructive" : "bg-primary")}
							key={`spark-${index.toString()}`}
							style={{ height: `${Math.min(100, Math.max(0, value * 100))}%` }}
						/>
					))
				) : sparklineWarmingLabel ? (
					<Text className="w-full text-center font-mono text-xs text-muted-foreground">
						{sparklineWarmingLabel}
					</Text>
				) : null}
			</View>
			<View className="flex-row items-center justify-between">
				<Text className="font-mono text-xs text-muted-foreground">{serverLabel}</Text>
				<Text className="font-mono text-xs text-primary">{paygLabel}</Text>
			</View>
		</Card>
	);
}

function slaStatusClass(tone: keyof typeof SLA_INDICATOR_CLASS): string {
	if (tone === "warning") {
		return "text-warning";
	}
	if (tone === "destructive") {
		return "text-destructive";
	}
	if (tone === "sla") {
		return "text-sla";
	}
	return "text-primary";
}

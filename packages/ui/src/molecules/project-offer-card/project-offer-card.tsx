import { View } from "react-native";

import { cn } from "@/utils";
import { Button } from "../../atoms/button";
import { Card } from "../../atoms/card";
import { Text } from "../../atoms/text";
import { MetricStat } from "../metric-stat/metric-stat";
import { type ServerOption, ServerSelect } from "../server-select";

export type { ServerOption } from "../server-select";

export interface ProjectOfferCardProps {
	readonly customerName: string;
	readonly name: string;
	readonly regionLabel: string;
	readonly regionClassName?: string;
	readonly cpuLabel: string;
	readonly paygLabel: string;
	readonly slaLabel: string;
	readonly onAccept: () => void;
	readonly onDecline: () => void;
	readonly disabled?: boolean;
	readonly className?: string;
	readonly serverOptions?: readonly ServerOption[];
	readonly selectedServerId?: string;
	readonly onSelectServer?: (serverId: string) => void;
	readonly serverSelectLabel?: string;
	readonly noServersLabel?: string;
}

export function ProjectOfferCard({
	customerName,
	name,
	regionLabel,
	regionClassName,
	cpuLabel,
	paygLabel,
	slaLabel,
	onAccept,
	onDecline,
	disabled,
	className,
	serverOptions,
	selectedServerId,
	onSelectServer,
	serverSelectLabel = "Server",
	noServersLabel = "No servers",
}: ProjectOfferCardProps) {
	const serverUnresolved =
		serverOptions !== undefined && (serverOptions.length === 0 || selectedServerId === undefined);

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
			<View className="flex-row gap-1">
				<MetricStat className="flex-1" label="CPU" tone="info" value={cpuLabel} />
				<MetricStat className="flex-1" label="PAYG" tone="primary" value={paygLabel} />
				<MetricStat className="flex-1" label="SLA" tone="warning" value={slaLabel} />
			</View>
			{serverOptions === undefined ? null : (
				<ServerSelect
					emptyLabel={noServersLabel}
					label={serverSelectLabel}
					onSelect={onSelectServer}
					options={serverOptions}
					selectedId={selectedServerId}
				/>
			)}
			<View className="flex-row gap-1.5">
				<Button
					className="flex-1"
					disabled={serverUnresolved ? true : disabled}
					onClick={onAccept}
					size="sm"
					variant="outline"
				>
					ACCEPT
				</Button>
				<Button className="flex-1" onClick={onDecline} size="sm" variant="destructive">
					DECLINE
				</Button>
			</View>
		</Card>
	);
}

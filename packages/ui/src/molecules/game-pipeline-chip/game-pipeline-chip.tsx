import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export type GamePipelineTone = "ops" | "learn";

export interface GamePipelineChipProps {
	readonly label: string;
	readonly detail: string;
	readonly progress: number;
	readonly tone: GamePipelineTone;
	readonly flush?: boolean;
}

function GamePipelineChip({ label, detail, progress, tone, flush = false }: GamePipelineChipProps) {
	const fill = Math.min(100, Math.max(0, progress));
	const bar = tone === "ops" ? "bg-info" : "bg-warning";
	const lamp = tone === "ops" ? "bg-info shadow-glow-info" : "bg-warning shadow-glow-warning";
	const detailClass = tone === "ops" ? "text-info" : "text-warning";

	return (
		<View
			className={cn(
				"flex-row items-center",
				flush
					? "w-full border-t border-border"
					: "gap-1.5 rounded border border-border bg-muted px-2 py-0.5",
			)}
		>
			<View className={cn("items-center justify-center", flush ? "h-8 w-8" : undefined)}>
				<View className={cn("h-1.5 w-1.5 rounded-full", lamp)} />
			</View>
			<Text className={cn("text-[10px] text-foreground", flush ? "min-w-0 flex-1" : undefined)}>
				{label}
			</Text>
			<View
				className={cn(
					"h-0.5 overflow-hidden bg-border",
					flush ? "w-16 border-x border-border" : "w-12 rounded-full",
				)}
			>
				<View className={cn("h-full", bar)} style={{ width: `${String(fill)}%` }} />
			</View>
			<Text
				className={cn("font-mono text-[9px]", flush ? "w-10 text-center" : undefined, detailClass)}
			>
				{detail}
			</Text>
		</View>
	);
}

export { GamePipelineChip };

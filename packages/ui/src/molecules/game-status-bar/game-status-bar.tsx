import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export const GAME_STATUS_BAR_HEIGHT = {
	desktop: 44,
	mobile: 56,
} as const;

export type GameStatusBarPlacement = "static" | "absolute";
export type GameStatusBarDensity = "desktop" | "mobile";

export interface GameStatusBarProps {
	readonly placement?: GameStatusBarPlacement;
	readonly density?: GameStatusBarDensity;
	readonly showTaskGroup?: boolean;
	readonly leading?: ReactNode;
	readonly metrics?: ReactNode;
	readonly operationsProgress?: ReactNode;
	readonly learningProgress?: ReactNode;
	readonly clockControls?: ReactNode;
	readonly trailing?: ReactNode;
	readonly className?: string;
}

interface StatusBarGroupProps {
	readonly children?: ReactNode;
	readonly flex?: boolean;
	readonly last?: boolean;
	readonly className?: string;
	readonly width?: number;
}

function StatusBarGroup({ children, flex, last, className, width }: StatusBarGroupProps) {
	return (
		<View
			className={cn(
				"h-full flex-row items-center",
				!last && "border-r border-border",
				flex && "min-w-0 flex-1 overflow-hidden",
				className,
			)}
			style={width === undefined ? undefined : { width }}
		>
			{children}
		</View>
	);
}

function GameStatusBar({
	placement = "static",
	density = "desktop",
	showTaskGroup = true,
	leading,
	metrics,
	operationsProgress,
	learningProgress,
	clockControls,
	trailing,
	className,
}: GameStatusBarProps) {
	const height = GAME_STATUS_BAR_HEIGHT[density];
	const hasPipeline = Boolean(operationsProgress) || Boolean(learningProgress);
	const mobile = density === "mobile";
	const activityWidth = mobile ? 36 : 44;

	return (
		<View
			accessibilityLabel="Game status"
			className={cn(
				"flex-row items-stretch border-b border-border bg-hud",
				placement === "absolute" ? "z-10 border-b-0 border-t" : "shrink-0",
				className,
			)}
			style={
				placement === "absolute"
					? { position: "absolute", left: 0, right: 0, bottom: 0, height }
					: { height }
			}
			testID={`game-status-bar-${placement}`}
		>
			{leading ? <StatusBarGroup>{leading}</StatusBarGroup> : null}
			{metrics ? (
				<StatusBarGroup className={mobile ? "gap-2 px-2" : "gap-5 px-3.5"}>
					{metrics}
				</StatusBarGroup>
			) : null}
			{showTaskGroup ? (
				<StatusBarGroup className="gap-2.5 px-3" flex>
					{operationsProgress}
					{learningProgress}
					{hasPipeline ? null : (
						<Text className="text-[10px] text-muted-foreground">No active tasks</Text>
					)}
				</StatusBarGroup>
			) : (
				<StatusBarGroup flex />
			)}
			{clockControls ? (
				<StatusBarGroup className="h-full shrink-0">{clockControls}</StatusBarGroup>
			) : null}
			{trailing ? (
				<StatusBarGroup className="h-full items-center justify-center" last width={activityWidth}>
					{trailing}
				</StatusBarGroup>
			) : null}
		</View>
	);
}

export { GameStatusBar };

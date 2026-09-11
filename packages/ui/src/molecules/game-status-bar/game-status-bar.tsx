import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils";

export type GameStatusBarPlacement = "static" | "absolute";

export interface GameStatusBarProps {
	readonly placement?: GameStatusBarPlacement;
	readonly leading?: ReactNode;
	readonly metrics?: ReactNode;
	readonly operationsProgress?: ReactNode;
	readonly learningProgress?: ReactNode;
	readonly clockControls?: ReactNode;
	readonly trailing?: ReactNode;
	readonly className?: string;
}

function GameStatusBar({
	placement = "static",
	leading,
	metrics,
	operationsProgress,
	learningProgress,
	clockControls,
	trailing,
	className,
}: GameStatusBarProps) {
	return (
		<View
			accessibilityLabel="Game status"
			className={cn(
				"flex-row items-center border-b border-border bg-hud",
				placement === "absolute"
					? "absolute inset-x-0 bottom-0 z-10 border-b-0 border-t"
					: "relative shrink-0",
				className,
			)}
			testID={`game-status-bar-${placement}`}
		>
			{leading}
			{metrics}
			<View className="min-w-0 flex-1 flex-row items-center gap-2 overflow-hidden px-3 py-2">
				{operationsProgress}
				{learningProgress}
			</View>
			{clockControls}
			{trailing}
		</View>
	);
}

export { GameStatusBar };

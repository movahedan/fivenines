import { Pressable, View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export const GAME_CLOCK_SPEEDS = [0, 1, 2, 4] as const;

export type GameClockSpeed = (typeof GAME_CLOCK_SPEEDS)[number];

export type GameClockDensity = "desktop" | "mobile";

export interface GameClockControlsProps {
	readonly dateLabel: string;
	readonly dayProgress: number;
	readonly speed: GameClockSpeed;
	readonly onSpeedChange: (speed: GameClockSpeed) => void;
	readonly density?: GameClockDensity;
	readonly className?: string;
}

function GameClockControls({
	dateLabel,
	dayProgress,
	speed,
	onSpeedChange,
	density = "desktop",
	className,
}: GameClockControlsProps) {
	const fill = Math.min(1, Math.max(0, dayProgress)) * 100;
	const mobile = density === "mobile";
	const buttonGap = 3;
	const pauseWidth = mobile ? 20 : 26;
	const speedWidth = mobile ? 20 : 22;
	const speedHeight = mobile ? 16 : 20;
	const padX = 8;
	const clusterWidth =
		pauseWidth +
		speedWidth * (GAME_CLOCK_SPEEDS.length - 1) +
		buttonGap * (GAME_CLOCK_SPEEDS.length - 1);

	return (
		<View
			className={cn(
				"h-full items-center justify-center",
				mobile ? "flex-col gap-1 px-2 py-1" : "flex-row gap-2.5 px-3",
				className,
			)}
			style={mobile ? { width: clusterWidth + padX * 2 } : undefined}
		>
			<View className={cn("gap-1", mobile && "w-full items-center")}>
				<Text
					className={cn(
						"font-mono font-bold leading-none text-foreground",
						mobile ? "text-[10px]" : "text-[11px]",
					)}
					numberOfLines={mobile ? 1 : undefined}
				>
					{dateLabel}
				</Text>
				<View className={cn("h-[3px] overflow-hidden rounded-sm bg-muted", mobile && "w-full")}>
					<View className="h-full rounded-sm bg-info" style={{ width: `${String(fill)}%` }} />
				</View>
			</View>
			<View className="flex-row" style={{ gap: buttonGap }}>
				{GAME_CLOCK_SPEEDS.map((value) => {
					const selected = speed === value;

					return (
						<Pressable
							key={value}
							accessibilityLabel={value === 0 ? "Pause" : `Speed ×${String(value)}`}
							accessibilityRole="button"
							accessibilityState={{ selected }}
							className={cn(
								"items-center justify-center rounded-sm border",
								selected ? "border-primary bg-primary/15" : "border-border bg-transparent",
							)}
							onPress={() => {
								onSpeedChange(value);
							}}
							style={{
								width: value === 0 ? pauseWidth : speedWidth,
								height: speedHeight,
							}}
						>
							<Text
								className={cn(
									"font-mono text-[9px] font-bold",
									selected ? "text-primary" : "text-muted-foreground",
								)}
							>
								{value === 0 ? "⏸" : `${String(value)}×`}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

export { GameClockControls };

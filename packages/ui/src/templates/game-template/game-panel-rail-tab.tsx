import { Platform, Pressable, View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export const GAME_PANEL_TAB_WIDTH = 28;

export interface GamePanelRailTabProps {
	readonly label: string;
	readonly expanded: boolean;
	readonly onPress: () => void;
	readonly accentEdge: "start" | "end";
	readonly showChevron?: boolean;
	readonly fill?: boolean;
	readonly className?: string;
}

function GamePanelRailTab({
	label,
	expanded,
	onPress,
	accentEdge,
	showChevron = false,
	fill = false,
	className,
}: GamePanelRailTabProps) {
	const chevronRotate =
		accentEdge === "start" ? (expanded ? "90deg" : "-90deg") : expanded ? "-90deg" : "90deg";
	const onRightStrip = accentEdge === "start";

	return (
		<Pressable
			accessibilityLabel={expanded ? `Collapse ${label}` : `Open ${label}`}
			accessibilityRole="button"
			accessibilityState={{ expanded }}
			className={cn("relative shrink-0 items-center justify-center bg-background", className)}
			onPress={onPress}
			style={{
				width: GAME_PANEL_TAB_WIDTH,
				...(fill ? { flex: 1 } : { height: "100%" }),
				borderTopWidth: 0,
				borderBottomWidth: onRightStrip ? 1 : 0,
				borderLeftWidth: 0,
				borderRightWidth: onRightStrip ? 0 : 1,
			}}
		>
			{expanded ? (
				<View
					className="bg-primary"
					style={{
						position: "absolute",
						top: 0,
						bottom: 0,
						width: 2,
						...(onRightStrip ? { left: 0 } : { right: 0 }),
					}}
				/>
			) : null}
			<View className="items-center gap-2.5">
				<Text
					className={cn(
						"text-[9px] font-bold uppercase tracking-[0.12em]",
						expanded ? "text-primary" : "text-muted-foreground",
					)}
					style={
						Platform.OS === "web"
							? ({
									transform: "rotate(180deg)",
									writingMode: "vertical-rl",
									whiteSpace: "nowrap",
								} as Record<string, string>)
							: undefined
					}
				>
					{label}
				</Text>
				{showChevron ? (
					<Text
						className={cn("text-[8px]", expanded ? "text-foreground" : "text-muted-foreground")}
						style={{ transform: [{ rotate: chevronRotate }] }}
					>
						▶
					</Text>
				) : null}
			</View>
		</Pressable>
	);
}

export { GamePanelRailTab };

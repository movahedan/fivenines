import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";
import {
	GAME_STATUS_BAR_HEIGHT,
	type GameStatusBarDensity,
} from "../../molecules/game-status-bar/game-status-bar";
import { GameChromeIconButton } from "./game-chrome-icon-button";

export interface GameChromeHeaderProps {
	readonly title: string;
	readonly onClose: () => void;
	readonly closeLabel: string;
	readonly density?: GameStatusBarDensity;
	readonly leading?: ReactNode;
	readonly titleClassName?: string;
}

function GameChromeHeader({
	title,
	onClose,
	closeLabel,
	density = "desktop",
	leading,
	titleClassName,
}: GameChromeHeaderProps) {
	return (
		<View
			className="flex-row items-center gap-2 border-b border-border px-3"
			style={{ height: GAME_STATUS_BAR_HEIGHT[density] }}
		>
			{leading}
			<Text
				className={cn(
					"flex-1 text-[10px] font-bold uppercase tracking-widest text-foreground",
					titleClassName,
				)}
			>
				{title}
			</Text>
			<GameChromeIconButton accessibilityLabel={closeLabel} label="×" onPress={onClose} size={22} />
		</View>
	);
}

export { GameChromeHeader };

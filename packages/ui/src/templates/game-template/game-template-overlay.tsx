import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import type { GameStatusBarDensity } from "../../molecules/game-status-bar/game-status-bar";
import { GameChromeHeader } from "./game-chrome-header";
import { GAME_SHELL_FILL } from "./game-shell-layer";

export interface GameTemplateOverlayProps {
	readonly side: "left" | "right";
	readonly title: string;
	readonly onClose: () => void;
	readonly children: ReactNode;
	readonly density?: GameStatusBarDensity;
}

function GameTemplateOverlay({
	side,
	title,
	onClose,
	children,
	density = "desktop",
}: GameTemplateOverlayProps) {
	return (
		<View style={{ ...GAME_SHELL_FILL, zIndex: 40, pointerEvents: "box-none" }}>
			<View className="bg-overlay-scrim backdrop-blur-[2px]" style={GAME_SHELL_FILL}>
				<Pressable
					accessibilityLabel={`Close ${title}`}
					accessibilityRole="button"
					onPress={onClose}
					style={GAME_SHELL_FILL}
				/>
			</View>
			<View
				accessibilityLabel={title}
				accessibilityRole="dialog"
				className="border-border bg-hud"
				style={{
					position: "absolute",
					top: 0,
					bottom: 0,
					width: 320,
					zIndex: 41,
					...(side === "left"
						? { left: 0, borderRightWidth: 1 }
						: { right: 0, borderLeftWidth: 1 }),
				}}
			>
				<GameChromeHeader
					closeLabel={`Dismiss ${title}`}
					density={density}
					leading={<View className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary" />}
					onClose={onClose}
					title={title}
				/>
				<View className="min-h-0 flex-1">{children}</View>
			</View>
		</View>
	);
}

export { GameTemplateOverlay };

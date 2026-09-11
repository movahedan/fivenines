import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import type { GameStatusBarDensity } from "../../molecules/game-status-bar/game-status-bar";
import { GameChromeHeader } from "./game-chrome-header";
import { GAME_SHELL_FILL } from "./game-shell-layer";

const DRAWER_MAX_WIDTH = 768;

export interface GameTemplateDrawerProps {
	readonly title: string;
	readonly onClose: () => void;
	readonly children: ReactNode;
	readonly density?: GameStatusBarDensity;
}

function GameTemplateDrawer({
	title,
	onClose,
	children,
	density = "desktop",
}: GameTemplateDrawerProps) {
	return (
		<View style={{ ...GAME_SHELL_FILL, zIndex: 50, pointerEvents: "box-none" }}>
			<View className="bg-overlay-scrim backdrop-blur-[2px]" style={GAME_SHELL_FILL}>
				<Pressable
					accessibilityLabel={`Dismiss ${title}`}
					accessibilityRole="button"
					onPress={onClose}
					style={GAME_SHELL_FILL}
				/>
			</View>
			<View
				style={{
					...GAME_SHELL_FILL,
					zIndex: 51,
					justifyContent: "flex-end",
					alignItems: "center",
					pointerEvents: "box-none",
				}}
			>
				<View
					accessibilityLabel={title}
					accessibilityRole="dialog"
					className="w-full border-t border-border bg-hud"
					style={{
						maxWidth: DRAWER_MAX_WIDTH,
						maxHeight: "88%",
					}}
				>
					<View className="items-center" style={{ height: 8, justifyContent: "center" }}>
						<View className="h-1 w-9 rounded-full bg-border" />
					</View>
					<GameChromeHeader
						closeLabel={`Close ${title}`}
						density={density}
						onClose={onClose}
						title={title}
						titleClassName="text-sm font-semibold normal-case tracking-normal"
					/>
					<View className="min-h-0">{children}</View>
				</View>
			</View>
		</View>
	);
}

export { GameTemplateDrawer };

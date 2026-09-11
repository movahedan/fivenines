import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Button } from "../../atoms/button";
import { Text } from "../../atoms/text";

export interface GameTemplateOverlayProps {
	readonly side: "left" | "right";
	readonly title: string;
	readonly onClose: () => void;
	readonly children: ReactNode;
}

function GameTemplateOverlay({ side, title, onClose, children }: GameTemplateOverlayProps) {
	return (
		<View className="absolute inset-0 z-20" style={{ pointerEvents: "box-none" }}>
			<Pressable
				accessibilityLabel={`Close ${title}`}
				accessibilityRole="button"
				className="absolute inset-0 bg-background/60"
				onPress={onClose}
			/>
			<View
				accessibilityLabel={title}
				accessibilityRole="dialog"
				className={
					side === "left"
						? "absolute bottom-0 left-0 top-0 w-80 border-r border-border bg-hud"
						: "absolute bottom-0 right-0 top-0 w-80 border-l border-border bg-hud"
				}
			>
				<View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
					<Text className="flex-1 text-xs font-bold uppercase tracking-widest text-foreground">
						{title}
					</Text>
					<Button
						accessibilityLabel={`Dismiss ${title}`}
						onClick={onClose}
						size="icon"
						variant="outline"
					>
						<Text>×</Text>
					</Button>
				</View>
				<View className="min-h-0 flex-1">{children}</View>
			</View>
		</View>
	);
}

export { GameTemplateOverlay };

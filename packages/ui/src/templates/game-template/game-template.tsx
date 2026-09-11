import { Pressable, View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";
import { useIsMobile } from "../../hooks/use-mobile";
import { GameStatusBar } from "../../molecules/game-status-bar/game-status-bar";
import type { GameTemplateProps } from "./game-template.types";
import { GameTemplateDesktop } from "./game-template-desktop";
import { GameTemplateDrawer } from "./game-template-drawer";
import { GameTemplateMobile } from "./game-template-mobile";
import { GameTemplateOverlay } from "./game-template-overlay";

function GameTemplate(props: GameTemplateProps) {
	const detectedMobile = useIsMobile();
	const isMobile = props.isMobile ?? detectedMobile;
	const activityTrigger = props.activityTrigger ?? (
		<Pressable
			accessibilityLabel="Activity"
			accessibilityRole="button"
			className="h-full w-full items-center justify-center"
			onPress={() => {
				props.onActivityOpenChange(true);
			}}
		>
			<Text className="text-lg text-muted-foreground">⌁</Text>
		</Pressable>
	);

	return (
		<View
			className={cn("min-h-0 flex-1 bg-background", props.className)}
			style={{ position: "relative", height: "100%", overflow: "hidden" }}
		>
			<GameStatusBar
				clockControls={props.clockControls}
				density={isMobile ? "mobile" : "desktop"}
				leading={props.accountControl}
				learningProgress={props.learningProgress}
				metrics={props.statusMetrics}
				operationsProgress={props.operationsProgress}
				placement="static"
				showTaskGroup={!isMobile}
				trailing={activityTrigger}
			/>
			{isMobile ? (
				<GameTemplateMobile template={props} />
			) : (
				<GameTemplateDesktop template={props} />
			)}
			{props.objectDrawer ? (
				<GameTemplateDrawer
					density={isMobile ? "mobile" : "desktop"}
					onClose={() => {
						props.onObjectDrawerClose?.();
					}}
					title={props.objectDrawerTitle ?? "Details"}
				>
					{props.objectDrawer}
				</GameTemplateDrawer>
			) : null}
			{props.accountOpen ? (
				<GameTemplateOverlay
					density={isMobile ? "mobile" : "desktop"}
					onClose={() => {
						props.onAccountOpenChange(false);
					}}
					side="left"
					title="Account"
				>
					{props.accountOverlay}
				</GameTemplateOverlay>
			) : null}
			{props.activityOpen ? (
				<GameTemplateOverlay
					density={isMobile ? "mobile" : "desktop"}
					onClose={() => {
						props.onActivityOpenChange(false);
					}}
					side="right"
					title="Activity"
				>
					{props.activityOverlay}
				</GameTemplateOverlay>
			) : null}
		</View>
	);
}

export type {
	GameCenterKind,
	GameDestination,
	GameRightDestination,
	GameTemplateProps,
} from "./game-template.types";
export {
	clampGamePanelWidth,
	GAME_DESTINATIONS,
	GAME_PANEL_WIDTH_MAX,
	GAME_PANEL_WIDTH_MIN,
	GAME_PANEL_WIDTH_PROJECTS_DEFAULT,
	GAME_PANEL_WIDTH_RIGHT_DEFAULT,
} from "./game-template.types";

export { GameTemplate };

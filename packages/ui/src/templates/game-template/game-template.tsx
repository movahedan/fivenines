import { View } from "react-native";

import { cn } from "@/utils";
import { Button } from "../../atoms/button";
import { Text } from "../../atoms/text";
import { useIsMobile } from "../../hooks/use-mobile";
import { GameStatusBar } from "../../molecules/game-status-bar/game-status-bar";
import type { GameTemplateProps } from "./game-template.types";
import { GameTemplateDesktop } from "./game-template-desktop";
import { GameTemplateMobile } from "./game-template-mobile";
import { GameTemplateOverlay } from "./game-template-overlay";

function GameTemplate(props: GameTemplateProps) {
	const detectedMobile = useIsMobile();
	const isMobile = props.isMobile ?? detectedMobile;
	const activityTrigger = props.activityTrigger ?? (
		<Button
			accessibilityLabel="Activity"
			onClick={() => {
				props.onActivityOpenChange(true);
			}}
			size="icon"
			variant="ghost"
		>
			<Text>⌁</Text>
		</Button>
	);

	return (
		<View className={cn("relative h-full min-h-0 flex-1 bg-background", props.className)}>
			<GameStatusBar
				clockControls={props.clockControls}
				leading={props.accountControl}
				learningProgress={props.learningProgress}
				metrics={props.statusMetrics}
				operationsProgress={props.operationsProgress}
				placement="static"
				trailing={activityTrigger}
			/>
			{isMobile ? (
				<GameTemplateMobile template={props} />
			) : (
				<GameTemplateDesktop template={props} />
			)}
			{props.objectDrawer}
			{props.accountOpen ? (
				<GameTemplateOverlay
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

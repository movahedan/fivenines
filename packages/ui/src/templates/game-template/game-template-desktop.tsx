import { View } from "react-native";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PanelHeader } from "../../molecules/panel-header/panel-header";
import { GameChromeIconButton } from "./game-chrome-icon-button";
import { GAME_PANEL_TAB_WIDTH, GamePanelRailTab } from "./game-panel-rail-tab";
import type { GameRightDestination, GameTemplateProps } from "./game-template.types";
import {
	GAME_PANEL_WIDTH_MIN,
	panelPercentToWidth,
	panelWidthToPercent,
} from "./game-template.types";

const ROW_WIDTH_FALLBACK = 1440;
const TAB_PERCENT = (GAME_PANEL_TAB_WIDTH / ROW_WIDTH_FALLBACK) * 100;

const RIGHT_TABS: readonly { id: Exclude<GameRightDestination, null>; label: string }[] = [
	{ id: "inventory", label: "Inventory" },
	{ id: "learning", label: "Learning" },
	{ id: "finances", label: "Finances" },
];

interface GameTemplateDesktopProps {
	readonly template: GameTemplateProps;
}

function rightPanelBody(template: GameTemplateProps) {
	if (template.rightDestination === "inventory") {
		return template.inventoryPanel;
	}

	if (template.rightDestination === "learning") {
		return template.learningPanel;
	}

	if (template.rightDestination === "finances") {
		return template.financesPanel;
	}

	return null;
}

function HiddenResizeHandle({ label }: { label: string }) {
	return (
		<PanelResizeHandle
			aria-label={label}
			style={{ width: 0, margin: 0, padding: 0, backgroundColor: "transparent" }}
		/>
	);
}

function GameTemplateDesktop({ template }: GameTemplateDesktopProps) {
	const rightOpen = template.rightDestination !== null;
	const projectsSize = template.projectsOpen
		? panelWidthToPercent(template.projectsWidth + GAME_PANEL_TAB_WIDTH, ROW_WIDTH_FALLBACK)
		: TAB_PERCENT;
	const projectsMinSize = template.projectsOpen
		? panelWidthToPercent(GAME_PANEL_WIDTH_MIN + GAME_PANEL_TAB_WIDTH, ROW_WIDTH_FALLBACK)
		: TAB_PERCENT;
	const rightSize = rightOpen ? panelWidthToPercent(template.rightWidth, ROW_WIDTH_FALLBACK) : 0;
	const centerSize = Math.max(24, 100 - projectsSize - rightSize);

	return (
		<View className="min-h-0 flex-1 flex-row">
			<PanelGroup
				className="h-full min-w-0 flex-1"
				direction="horizontal"
				key={`desktop-row-${template.projectsOpen ? "projects" : "tabs"}-${rightOpen ? "right" : "closed"}`}
			>
				<Panel
					defaultSize={projectsSize}
					id="projects"
					key={`projects-${String(template.projectsOpen)}`}
					maxSize={panelWidthToPercent(520 + GAME_PANEL_TAB_WIDTH, ROW_WIDTH_FALLBACK)}
					minSize={projectsMinSize}
					onResize={(percent) => {
						if (!template.projectsOpen) {
							return;
						}

						template.onProjectsWidthChange(
							panelPercentToWidth(percent, ROW_WIDTH_FALLBACK) - GAME_PANEL_TAB_WIDTH,
						);
					}}
				>
					<View className="h-full flex-row">
						{template.projectsOpen ? (
							<View className="min-w-0 flex-1 border-r border-border bg-background">
								{template.projectsPanel}
							</View>
						) : null}
						<GamePanelRailTab
							accentEdge="end"
							expanded={template.projectsOpen}
							label="Projects"
							onPress={() => {
								template.onProjectsOpenChange(!template.projectsOpen);
							}}
							showChevron
						/>
					</View>
				</Panel>

				{template.projectsOpen ? <HiddenResizeHandle label="Resize Projects" /> : null}

				<Panel defaultSize={centerSize} id="center" minSize={24} order={2}>
					<View className="h-full min-h-0 bg-background">{template.centerContent}</View>
				</Panel>

				{template.rightDestination ? (
					<>
						<HiddenResizeHandle label="Resize business panel" />
						<Panel
							defaultSize={panelWidthToPercent(template.rightWidth, ROW_WIDTH_FALLBACK)}
							id="business"
							key={template.rightDestination}
							maxSize={panelWidthToPercent(520, ROW_WIDTH_FALLBACK)}
							minSize={panelWidthToPercent(160, ROW_WIDTH_FALLBACK)}
							onResize={(percent) => {
								template.onRightWidthChange(panelPercentToWidth(percent, ROW_WIDTH_FALLBACK));
							}}
						>
							<View className="h-full min-h-0 border-l border-border bg-background">
								<PanelHeader
									label={template.rightDestination}
									trailing={
										<GameChromeIconButton
											accessibilityLabel="Close business panel"
											label="×"
											onPress={() => {
												template.onRightDestinationChange(null);
											}}
											size={22}
										/>
									}
								/>
								<View className="min-h-0 flex-1">{rightPanelBody(template)}</View>
							</View>
						</Panel>
					</>
				) : null}
			</PanelGroup>

			<View
				className="h-full shrink-0 flex-col border-l border-border"
				style={{ width: GAME_PANEL_TAB_WIDTH }}
			>
				{RIGHT_TABS.map((tab) => {
					const active = template.rightDestination === tab.id;

					return (
						<GamePanelRailTab
							key={tab.id}
							accentEdge="start"
							expanded={active}
							fill
							label={tab.label}
							onPress={() => {
								template.onRightDestinationChange(active ? null : tab.id);
							}}
						/>
					);
				})}
			</View>
		</View>
	);
}

export { GameTemplateDesktop };

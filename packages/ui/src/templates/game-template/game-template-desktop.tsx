import { useState } from "react";
import { View } from "react-native";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { cn } from "@/utils";
import { Button } from "../../atoms/button";
import { Text } from "../../atoms/text";
import { PanelHeader } from "../../molecules/panel-header/panel-header";
import type { GameRightDestination, GameTemplateProps } from "./game-template.types";
import { panelPercentToWidth, panelWidthToPercent } from "./game-template.types";

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

function GameTemplateDesktop({ template }: GameTemplateDesktopProps) {
	const [rowWidth, setRowWidth] = useState(0);

	return (
		<View className="min-h-0 flex-1 flex-row">
			{template.projectsOpen ? null : (
				<Button
					accessibilityLabel="Open Projects"
					className="h-full w-7 rounded-none"
					onClick={() => {
						template.onProjectsOpenChange(true);
					}}
					variant="ghost"
				>
					<Text className="-rotate-180 text-[10px] font-bold uppercase tracking-widest">
						Projects
					</Text>
				</Button>
			)}

			<View
				className="min-h-0 min-w-0 flex-1"
				onLayout={(event) => {
					setRowWidth(event.nativeEvent.layout.width);
				}}
			>
				<PanelGroup className="flex h-full w-full flex-row" direction="horizontal">
					{template.projectsOpen ? (
						<>
							<Panel
								id="projects"
								minSize={panelWidthToPercent(160, Math.max(rowWidth, 800))}
								maxSize={panelWidthToPercent(520, Math.max(rowWidth, 800))}
								defaultSize={panelWidthToPercent(template.projectsWidth, Math.max(rowWidth, 800))}
								onResize={(percent) => {
									template.onProjectsWidthChange(
										panelPercentToWidth(percent, Math.max(rowWidth, 800)),
									);
								}}
							>
								<View className="h-full min-h-0 border-r border-border bg-hud">
									<PanelHeader
										label="Projects"
										trailing={
											<Button
												accessibilityLabel="Collapse Projects"
												onClick={() => {
													template.onProjectsOpenChange(false);
												}}
												size="icon"
												variant="ghost"
											>
												<Text>‹</Text>
											</Button>
										}
									/>
									<View className="min-h-0 flex-1">{template.projectsPanel}</View>
								</View>
							</Panel>
							<PanelResizeHandle
								aria-label="Resize Projects"
								className="w-1 bg-border motion-reduce:transition-none"
							/>
						</>
					) : null}

					<Panel id="center" minSize={30} order={2}>
						<View className="h-full min-h-0 min-w-[320px] bg-background">
							{template.centerContent}
						</View>
					</Panel>

					{template.rightDestination ? (
						<>
							<PanelResizeHandle
								aria-label="Resize business panel"
								className="w-1 bg-border motion-reduce:transition-none"
							/>
							<Panel
								id="business"
								minSize={panelWidthToPercent(160, Math.max(rowWidth, 800))}
								maxSize={panelWidthToPercent(520, Math.max(rowWidth, 800))}
								defaultSize={panelWidthToPercent(template.rightWidth, Math.max(rowWidth, 800))}
								onResize={(percent) => {
									template.onRightWidthChange(
										panelPercentToWidth(percent, Math.max(rowWidth, 800)),
									);
								}}
							>
								<View className="h-full min-h-0 border-l border-border bg-hud">
									<PanelHeader
										label={template.rightDestination}
										trailing={
											<Button
												accessibilityLabel="Close business panel"
												onClick={() => {
													template.onRightDestinationChange(null);
												}}
												size="icon"
												variant="ghost"
											>
												<Text>×</Text>
											</Button>
										}
									/>
									<View className="min-h-0 flex-1">{rightPanelBody(template)}</View>
								</View>
							</Panel>
						</>
					) : null}
				</PanelGroup>
			</View>

			<View className="w-7 shrink-0 border-l border-border bg-hud">
				{RIGHT_TABS.map((tab) => {
					const active = template.rightDestination === tab.id;

					return (
						<Button
							key={tab.id}
							accessibilityLabel={tab.label}
							accessibilityState={{ selected: active }}
							className={cn("h-1/3 w-full rounded-none", active ? "border-l-2 border-primary" : "")}
							onClick={() => {
								template.onRightDestinationChange(active ? null : tab.id);
							}}
							variant="ghost"
						>
							<Text
								className={cn(
									"-rotate-180 text-[10px] font-bold uppercase tracking-widest",
									active ? "text-primary" : "text-muted-foreground",
								)}
							>
								{tab.label}
							</Text>
						</Button>
					);
				})}
			</View>
		</View>
	);
}

export { GameTemplateDesktop };

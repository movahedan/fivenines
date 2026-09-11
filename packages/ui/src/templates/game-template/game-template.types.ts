import type { ReactNode } from "react";

export const GAME_DESTINATIONS = ["projects", "inventory", "learning", "finances"] as const;

export type GameDestination = (typeof GAME_DESTINATIONS)[number];

export type GameRightDestination = Exclude<GameDestination, "projects"> | null;

export type GameCenterKind = "empty" | "project" | "offer" | "contractReview";

export const GAME_PANEL_WIDTH_MIN = 160;
export const GAME_PANEL_WIDTH_MAX = 520;
export const GAME_PANEL_WIDTH_PROJECTS_DEFAULT = 220;
export const GAME_PANEL_WIDTH_RIGHT_DEFAULT = 260;

export interface GameTemplateProps {
	readonly isMobile?: boolean;
	readonly destination: GameDestination;
	readonly onDestinationChange: (destination: GameDestination) => void;
	readonly onNewProject: () => void;
	readonly projectsOpen: boolean;
	readonly onProjectsOpenChange: (open: boolean) => void;
	readonly projectsWidth: number;
	readonly onProjectsWidthChange: (width: number) => void;
	readonly rightDestination: GameRightDestination;
	readonly onRightDestinationChange: (destination: GameRightDestination) => void;
	readonly rightWidth: number;
	readonly onRightWidthChange: (width: number) => void;
	readonly activityOpen: boolean;
	readonly onActivityOpenChange: (open: boolean) => void;
	readonly accountOpen: boolean;
	readonly onAccountOpenChange: (open: boolean) => void;
	readonly accountControl: ReactNode;
	readonly accountOverlay: ReactNode;
	readonly statusMetrics: ReactNode;
	readonly operationsProgress?: ReactNode;
	readonly learningProgress?: ReactNode;
	readonly clockControls: ReactNode;
	readonly activityTrigger?: ReactNode;
	readonly activityOverlay: ReactNode;
	readonly projectsPanel: ReactNode;
	readonly centerContent: ReactNode;
	readonly centerKind: GameCenterKind;
	readonly inventoryPanel: ReactNode;
	readonly learningPanel: ReactNode;
	readonly financesPanel: ReactNode;
	readonly objectDrawer?: ReactNode;
	readonly objectDrawerTitle?: string;
	readonly onObjectDrawerClose?: () => void;
	readonly mobileProgressStrip?: ReactNode;
	readonly className?: string;
}

export function clampGamePanelWidth(width: number): number {
	return Math.min(GAME_PANEL_WIDTH_MAX, Math.max(GAME_PANEL_WIDTH_MIN, Math.round(width)));
}

export function panelWidthToPercent(width: number, rowWidth: number): number {
	if (rowWidth <= 0) {
		return 20;
	}

	return (clampGamePanelWidth(width) / rowWidth) * 100;
}

export function panelPercentToWidth(percent: number, rowWidth: number): number {
	if (rowWidth <= 0) {
		return GAME_PANEL_WIDTH_PROJECTS_DEFAULT;
	}

	return clampGamePanelWidth((percent / 100) * rowWidth);
}

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";
import { GameClockControls } from "../../molecules/game-clock-controls/game-clock-controls";
import { MetricStat } from "../../molecules/metric-stat/metric-stat";
import { GameTemplate } from "./game-template";
import type { GameDestination, GameRightDestination } from "./game-template.types";

function Placeholder({ label }: { label: string }) {
	return (
		<View className="p-4">
			<Text className="text-sm text-muted-foreground">{label}</Text>
		</View>
	);
}

function AccountControl({ compact, onPress }: { compact: boolean; onPress: () => void }) {
	return (
		<Pressable
			accessibilityLabel="Account"
			accessibilityRole="button"
			className="h-full flex-row items-center gap-2.5 px-3.5"
			onPress={onPress}
			style={
				compact ? { width: 40, paddingHorizontal: 0, justifyContent: "center" } : { width: 168 }
			}
		>
			<View
				className={cn(
					"items-center justify-center rounded border border-primary/40 bg-primary/15",
					compact ? "h-5 w-5" : "h-6 w-6",
				)}
			>
				<Text className="font-mono text-[10px] font-extrabold text-primary">OP</Text>
			</View>
			{compact ? null : (
				<View className="min-w-0">
					<Text className="text-[11px] font-bold leading-none text-foreground">Operator</Text>
					<Text className="mt-0.5 text-[9px] text-muted-foreground">ops@fivenines.io</Text>
				</View>
			)}
		</Pressable>
	);
}

function CashGroup({ compact }: { compact: boolean }) {
	return (
		<>
			<MetricStat
				compact={compact}
				label="CASH"
				tone="primary"
				value={compact ? "♦500" : "♦500.00"}
			/>
			<MetricStat compact={compact} label="REP" value="0" />
			<MetricStat compact={compact} label="OPEX" value={compact ? "♦9" : "♦8.90"} />
		</>
	);
}

function PipelineChip({
	label,
	detail,
	progress,
	tone,
	flush = false,
}: {
	label: string;
	detail: string;
	progress: number;
	tone: "ops" | "learn";
	flush?: boolean;
}) {
	const bar = tone === "ops" ? "bg-info" : "bg-warning";
	const lamp = tone === "ops" ? "bg-info shadow-glow-info" : "bg-warning shadow-glow-warning";
	const detailClass = tone === "ops" ? "text-info" : "text-warning";

	return (
		<View
			className={cn(
				"flex-row items-center",
				flush
					? "w-full border-t border-border"
					: "gap-1.5 rounded border border-border bg-muted px-2 py-0.5",
			)}
		>
			<View className={cn("items-center justify-center", flush ? "h-8 w-8" : undefined)}>
				<View className={cn("h-1.5 w-1.5 rounded-full", lamp)} />
			</View>
			<Text className={cn("text-[10px] text-foreground", flush ? "min-w-0 flex-1" : undefined)}>
				{label}
			</Text>
			<View
				className={cn(
					"h-0.5 overflow-hidden bg-border",
					flush ? "w-16 border-x border-border" : "w-12 rounded-full",
				)}
			>
				<View className={cn("h-full", bar)} style={{ width: `${String(progress)}%` }} />
			</View>
			<Text
				className={cn("font-mono text-[9px]", flush ? "w-10 text-center" : undefined, detailClass)}
			>
				{detail}
			</Text>
		</View>
	);
}

function GameTemplatePlayground({
	isMobile,
	drawerOpen,
	busy,
}: {
	isMobile: boolean;
	drawerOpen?: boolean;
	busy?: boolean;
}) {
	const [destination, setDestination] = useState<GameDestination>("projects");
	const [projectsOpen, setProjectsOpen] = useState(true);
	const [rightDestination, setRightDestination] = useState<GameRightDestination>(null);
	const [activityOpen, setActivityOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [projectsWidth, setProjectsWidth] = useState(220);
	const [rightWidth, setRightWidth] = useState(260);
	const [speed, setSpeed] = useState<0 | 1 | 2 | 4>(1);
	const [detailsOpen, setDetailsOpen] = useState(drawerOpen ?? false);

	const opsChip = <PipelineChip detail="1h" label="App Runtime install" progress={55} tone="ops" />;
	const learnChip = (
		<PipelineChip detail="40%" label="Capacity planning" progress={40} tone="learn" />
	);
	const opsRow = (
		<PipelineChip detail="1h" flush label="App Runtime install" progress={55} tone="ops" />
	);
	const learnRow = (
		<PipelineChip detail="40%" flush label="Capacity planning" progress={40} tone="learn" />
	);

	return (
		<View style={{ height: "100%", flex: 1 }}>
			<GameTemplate
				accountControl={
					<AccountControl
						compact={isMobile}
						onPress={() => {
							setAccountOpen(true);
						}}
					/>
				}
				accountOpen={accountOpen}
				accountOverlay={<Placeholder label="Settings and Sign out" />}
				activityOpen={activityOpen}
				activityOverlay={<Placeholder label="Event history" />}
				centerContent={<Placeholder label="Project workspace" />}
				centerKind="project"
				clockControls={
					<GameClockControls
						dateLabel="Sep 11, 2026"
						dayProgress={0.42}
						density={isMobile ? "mobile" : "desktop"}
						onSpeedChange={setSpeed}
						speed={speed}
					/>
				}
				destination={destination}
				financesPanel={<Placeholder label="Business finances" />}
				inventoryPanel={<Placeholder label="Inventory" />}
				isMobile={isMobile}
				learningPanel={<Placeholder label="Learning" />}
				learningProgress={busy && !isMobile ? learnChip : undefined}
				mobileProgressStrip={
					busy && isMobile ? (
						<View className="border-b border-border">
							{opsRow}
							{learnRow}
						</View>
					) : undefined
				}
				objectDrawer={
					detailsOpen ? (
						<View className="gap-3 p-4">
							<Text className="text-sm font-semibold text-foreground">
								Server · Maya's Appointments
							</Text>
							<Text className="text-xs text-muted-foreground">
								Object details sit in a bottom sheet with a dimmed overlay. The template owns
								chrome; this body is a slot.
							</Text>
							<Text className="text-xs text-muted-foreground">
								Region · starter-1 · 2 vCPU · 4 GiB
							</Text>
						</View>
					) : undefined
				}
				objectDrawerTitle="Object details"
				onAccountOpenChange={setAccountOpen}
				onActivityOpenChange={setActivityOpen}
				onDestinationChange={setDestination}
				onNewProject={() => {
					setDestination("projects");
				}}
				onObjectDrawerClose={() => {
					setDetailsOpen(false);
				}}
				onProjectsOpenChange={setProjectsOpen}
				onProjectsWidthChange={setProjectsWidth}
				onRightDestinationChange={setRightDestination}
				onRightWidthChange={setRightWidth}
				operationsProgress={busy && !isMobile ? opsChip : undefined}
				projectsOpen={projectsOpen}
				projectsPanel={<Placeholder label="Projects list" />}
				projectsWidth={projectsWidth}
				rightDestination={rightDestination}
				rightWidth={rightWidth}
				statusMetrics={<CashGroup compact={isMobile} />}
			/>
		</View>
	);
}

const meta: Meta<typeof GameTemplatePlayground> = {
	title: "Templates/GameTemplate",
	component: GameTemplatePlayground,
	parameters: {
		layout: "fullscreen",
		controls: {
			include: ["isMobile"],
		},
		docs: {
			description: {
				component:
					"Desktop folder tabs and mobile destinations around the same slotted sections. Business state stays in the parent.",
			},
		},
	},
	argTypes: {
		isMobile: { control: "boolean" },
		drawerOpen: { table: { disable: true } },
		busy: { table: { disable: true } },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	args: {
		isMobile: false,
	},
};

export const Mobile: Story = {
	args: {
		isMobile: true,
	},
};

export const DesktopBusy: Story = {
	args: {
		isMobile: false,
		busy: true,
	},
};

export const MobileBusy: Story = {
	args: {
		isMobile: true,
		busy: true,
	},
};

export const DrawerOpen: Story = {
	args: {
		isMobile: false,
		drawerOpen: true,
	},
};

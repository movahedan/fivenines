import { View } from "react-native";

import { cn } from "@/utils";
import { Button } from "../../atoms/button";
import { Text } from "../../atoms/text";
import type { GameDestination, GameTemplateProps } from "./game-template.types";

const MOBILE_TABS: readonly { id: GameDestination; label: string }[] = [
	{ id: "projects", label: "Projects" },
	{ id: "inventory", label: "Inventory" },
	{ id: "learning", label: "Learning" },
	{ id: "finances", label: "Finances" },
];

interface GameTemplateMobileProps {
	readonly template: GameTemplateProps;
}

function mobileBody(template: GameTemplateProps) {
	if (template.destination === "inventory") {
		return template.inventoryPanel;
	}

	if (template.destination === "learning") {
		return template.learningPanel;
	}

	if (template.destination === "finances") {
		return template.financesPanel;
	}

	if (template.centerKind === "empty") {
		return template.projectsPanel;
	}

	return template.centerContent;
}

function GameTemplateMobile({ template }: GameTemplateMobileProps) {
	const left = MOBILE_TABS.slice(0, 2);
	const right = MOBILE_TABS.slice(2);

	return (
		<View className="min-h-0 flex-1">
			<View className="min-h-0 flex-1">{mobileBody(template)}</View>
			{template.mobileProgressStrip}
			<View
				accessibilityLabel="Game destinations"
				accessibilityRole="tablist"
				className="h-14 shrink-0 flex-row border-t border-border bg-hud pb-safe"
			>
				{left.map((tab) => (
					<MobileTab
						key={tab.id}
						active={template.destination === tab.id}
						label={tab.label}
						onPress={() => {
							template.onDestinationChange(tab.id);
						}}
					/>
				))}
				<Button
					accessibilityLabel="New project"
					className="h-full w-14 rounded-none"
					onClick={template.onNewProject}
					variant="ghost"
				>
					<View className="h-9 w-9 items-center justify-center rounded-full border border-primary bg-primary/15">
						<Text className="text-lg text-primary">+</Text>
					</View>
				</Button>
				{right.map((tab) => (
					<MobileTab
						key={tab.id}
						active={template.destination === tab.id}
						label={tab.label}
						onPress={() => {
							template.onDestinationChange(tab.id);
						}}
					/>
				))}
			</View>
		</View>
	);
}

interface MobileTabProps {
	readonly label: string;
	readonly active: boolean;
	readonly onPress: () => void;
}

function MobileTab({ label, active, onPress }: MobileTabProps) {
	return (
		<Button
			accessibilityLabel={label}
			accessibilityState={{ selected: active }}
			className={cn(
				"h-full flex-1 rounded-none",
				active ? "border-t-2 border-primary" : "border-t-2 border-transparent",
			)}
			onClick={onPress}
			variant="ghost"
		>
			<Text
				className={cn(
					"text-[10px] font-bold uppercase tracking-widest",
					active ? "text-primary" : "text-muted-foreground",
				)}
			>
				{label}
			</Text>
		</Button>
	);
}

export { GameTemplateMobile };

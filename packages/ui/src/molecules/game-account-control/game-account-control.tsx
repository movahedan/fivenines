import { Pressable, View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export interface GameAccountControlProps {
	readonly compact?: boolean;
	readonly name?: string;
	readonly email?: string;
	readonly onPress: () => void;
}

function GameAccountControl({
	compact = false,
	name = "Operator",
	email = "ops@fivenines.io",
	onPress,
}: GameAccountControlProps) {
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
					<Text className="text-[11px] font-bold leading-none text-foreground">{name}</Text>
					<Text className="mt-0.5 text-[9px] text-muted-foreground">{email}</Text>
				</View>
			)}
		</Pressable>
	);
}

export { GameAccountControl };

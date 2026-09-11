import { Pressable } from "react-native";

import { Text } from "../../atoms/text";

export interface GameChromeIconButtonProps {
	readonly accessibilityLabel: string;
	readonly onPress: () => void;
	readonly label: string;
	readonly size?: number;
}

function GameChromeIconButton({
	accessibilityLabel,
	onPress,
	label,
	size = 26,
}: GameChromeIconButtonProps) {
	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			className="items-center justify-center border border-border bg-transparent"
			onPress={onPress}
			style={{ width: size, height: size, borderRadius: 4 }}
		>
			<Text className="text-sm leading-none text-muted-foreground">{label}</Text>
		</Pressable>
	);
}

export { GameChromeIconButton };

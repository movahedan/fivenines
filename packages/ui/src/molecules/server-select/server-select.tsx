import type { ChangeEvent } from "react";
import { useId } from "react";
import { View } from "react-native";

import { Text } from "../../atoms/text";

export interface ServerOption {
	readonly id: string;
	readonly label: string;
}

export interface ServerSelectProps {
	readonly options: readonly ServerOption[];
	readonly selectedId?: string;
	readonly onSelect?: (serverId: string) => void;
	readonly label: string;
	readonly emptyLabel?: string;
}

export function ServerSelect({
	options,
	selectedId,
	onSelect,
	label,
	emptyLabel,
}: ServerSelectProps) {
	const selectId = useId();

	if (options.length === 0) {
		return emptyLabel === undefined ? null : (
			<Text className="font-mono text-xs tracking-wide text-muted-foreground">{emptyLabel}</Text>
		);
	}

	return (
		<View className="gap-1">
			<label className="font-mono text-xs tracking-wide text-muted-foreground" htmlFor={selectId}>
				{label}
			</label>
			<select
				className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-card-foreground"
				id={selectId}
				onChange={(event: ChangeEvent<HTMLSelectElement>) => onSelect?.(event.target.value)}
				value={selectedId ?? ""}
			>
				{selectedId === undefined ? <option disabled value="" /> : null}
				{options.map((option) => (
					<option key={option.id} value={option.id}>
						{option.label}
					</option>
				))}
			</select>
		</View>
	);
}

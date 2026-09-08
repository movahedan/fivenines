import { SelectField } from "@/atoms/select-field";
import { Text } from "@/atoms/text";

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
	if (options.length === 0) {
		return emptyLabel === undefined ? null : (
			<Text className="font-mono text-xs tracking-wide text-muted-foreground">{emptyLabel}</Text>
		);
	}

	return (
		<SelectField
			label={label}
			onValueChange={onSelect}
			options={options.map((option) => ({ value: option.id, label: option.label }))}
			value={selectedId}
		/>
	);
}

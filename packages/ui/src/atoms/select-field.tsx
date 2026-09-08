import type { ChangeEvent } from "react";
import { useId } from "react";
import { Platform, View } from "react-native";

import { Text } from "@/atoms/text";
import { cn } from "@/utils";

export interface SelectFieldOption {
	readonly value: string;
	readonly label: string;
}

export interface SelectFieldProps {
	readonly options: readonly SelectFieldOption[];
	readonly value?: string;
	readonly onValueChange?: (value: string) => void;
	readonly label: string;
	readonly className?: string;
}

const LABEL_CLASS = "font-mono text-xs tracking-wide text-muted-foreground";

/**
 * Compact inline picker for ops chrome — a real `<select>` on web, so it stays
 * keyboard and screen-reader native and needs no portal host.
 *
 * Deliberately not built on the RNR `Select` atom: that one is portal-based and
 * pulls `react-native-screens` plus reanimated at import time, which the test
 * preload cannot load, and a portalled listbox is the wrong shape for a control
 * that sits inline on a dense card.
 *
 * @platform Web. On native it degrades to a read-only label + value pair rather
 * than rendering DOM elements, so importing it cannot crash a native build.
 * Reach for the RNR `Select` atom when a native target actually lands.
 */
export function SelectField({ options, value, onValueChange, label, className }: SelectFieldProps) {
	const selectId = useId();

	if (Platform.OS !== "web") {
		const selected = options.find((option) => option.value === value);

		return (
			<View className={cn("gap-1", className)}>
				<Text className={LABEL_CLASS}>{label}</Text>
				<Text className="font-mono text-xs text-card-foreground">{selected?.label ?? "—"}</Text>
			</View>
		);
	}

	return (
		<View className={cn("gap-1", className)}>
			<label className={LABEL_CLASS} htmlFor={selectId}>
				{label}
			</label>
			<select
				className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-card-foreground"
				id={selectId}
				onChange={(event: ChangeEvent<HTMLSelectElement>) => onValueChange?.(event.target.value)}
				value={value ?? ""}
			>
				{value === undefined ? <option disabled value="" /> : null}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</View>
	);
}

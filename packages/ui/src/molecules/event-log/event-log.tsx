import { type ComponentRef, useEffect, useRef } from "react";
import { View } from "react-native";

import { cn } from "@/utils";
import { Text } from "../../atoms/text";

export type EventLogTone = "info" | "warn" | "danger" | "success";

export interface EventLogEntry {
	readonly id: string;
	readonly tickLabel: string;
	readonly message: string;
	readonly tone: EventLogTone;
}

export interface EventLogProps {
	readonly entries: readonly EventLogEntry[];
	readonly className?: string;
}

const EVENT_TONE_CLASS = {
	info: "text-info",
	warn: "text-warning",
	danger: "text-destructive",
	success: "text-primary",
} as const;

function eventToneClass(tone: EventLogTone): string {
	return EVENT_TONE_CLASS[tone];
}

function EventLog({ entries, className }: EventLogProps) {
	const listRef = useRef<ComponentRef<typeof View> | null>(null);

	useEffect(() => {
		const node = listRef.current as unknown as {
			scrollTop?: number;
			scrollHeight?: number;
		} | null;

		if (node === null || node.scrollTop === undefined || node.scrollHeight === undefined) {
			return;
		}

		node.scrollTop = node.scrollHeight;
	}, []);

	return (
		<View
			className={cn("h-full min-h-0 flex-1 bg-hud font-mono", className)}
			ref={listRef}
			style={{ overflow: "scroll" }}
			testID="event-log-scroller"
		>
			{entries.map((entry) => {
				const toneClass = eventToneClass(entry.tone);

				return (
					<View key={entry.id} className="flex-row items-start gap-2 px-3 py-1">
						<Text className={toneClass}>{`[${entry.tickLabel}]`}</Text>
						<Text className={toneClass}>•</Text>
						<Text className={cn("flex-1", toneClass)}>{entry.message}</Text>
					</View>
				);
			})}
		</View>
	);
}

export { EventLog };

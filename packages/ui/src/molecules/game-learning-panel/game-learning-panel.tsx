import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { cn } from "@/utils";
import { Button } from "../../atoms/button";
import { Text } from "../../atoms/text";

export type GameLearningStatus =
	| "locked"
	| "available"
	| "insufficient-funds"
	| "active"
	| "paused"
	| "completed";

export type GameLearningTab = "technologies" | "courses";

export interface GameLearningTechnologyItem {
	readonly id: string;
	readonly name: string;
	readonly family: string;
	readonly status: GameLearningStatus;
	readonly description: string;
	readonly requires: readonly string[];
	readonly researchHours?: number;
	readonly tuitionLabel?: string;
	readonly enrollmentId?: string;
	readonly enrollDisabled?: boolean;
}

export interface GameLearningCourseItem {
	readonly id: string;
	readonly name: string;
	readonly mark: string;
	readonly status: GameLearningStatus;
	readonly currentLevel: number;
	readonly maxLevel: number;
	readonly effect: string;
	readonly tuitionLabel: string;
	readonly durationLabel: string;
	readonly enrollmentId?: string;
	readonly enrollDisabled?: boolean;
}

export interface GameLearningOngoingItem {
	readonly id: string;
	readonly name: string;
	readonly detail: string;
	readonly mark: string;
}

export interface GameLearningPanelProps {
	readonly technologies: readonly GameLearningTechnologyItem[];
	readonly courses: readonly GameLearningCourseItem[];
	readonly ongoing: readonly GameLearningOngoingItem[];
	readonly onStartResearch: (id: string) => void;
	readonly onEnrollCourse: (id: string) => void;
	readonly onPause: (enrollmentId: string) => void;
	readonly onResume: (enrollmentId: string) => void;
}

const FAMILY_TONE: Record<string, string> = {
	Application: "text-info border-info/40 bg-info/15",
	Database: "text-warning border-warning/40 bg-warning/15",
	Observability: "text-primary border-primary/40 bg-primary/15",
	Routing: "text-muted-foreground border-border bg-muted",
	Reliability: "text-destructive border-destructive/40 bg-destructive/15",
	Data: "text-warning border-warning/40 bg-warning/15",
};

const FAMILY_MARK: Record<string, string> = {
	Application: "A",
	Database: "D",
	Observability: "O",
	Routing: "R",
	Reliability: "★",
	Data: "∂",
};

const COURSE_TONES = [
	"text-info border-info/40 bg-info/15",
	"text-primary border-primary/40 bg-primary/15",
	"text-warning border-warning/40 bg-warning/15",
	"text-muted-foreground border-border bg-muted",
	"text-destructive border-destructive/40 bg-destructive/15",
] as const;

const STATUS_TONE: Record<GameLearningStatus, string> = {
	completed: "text-primary border-primary/40 bg-primary/15",
	available: "text-info border-info/40 bg-info/15",
	active: "text-warning border-warning/40 bg-warning/15",
	paused: "text-muted-foreground border-border bg-muted",
	"insufficient-funds": "text-warning border-warning/40 bg-warning/15",
	locked: "text-muted-foreground border-border bg-muted",
};

function familyTone(family: string): string {
	return FAMILY_TONE[family] ?? "text-muted-foreground border-border bg-muted";
}

function familyMark(family: string): string {
	return FAMILY_MARK[family] ?? "?";
}

function courseTone(mark: string): string {
	const index = mark.charCodeAt(0) % COURSE_TONES.length;

	return COURSE_TONES[index] ?? COURSE_TONES[0];
}

function statusLabel(status: GameLearningStatus): string {
	if (status === "completed") {
		return "UNLOCKED";
	}

	if (status === "insufficient-funds") {
		return "FUNDS";
	}

	return status.toUpperCase();
}

function Glyph({ mark, toneClass, size }: { mark: string; toneClass: string; size: number }) {
	return (
		<View
			className={cn("items-center justify-center rounded-full border", toneClass)}
			style={{ width: size, height: size }}
		>
			<Text className={cn("font-mono font-extrabold", size > 26 ? "text-[10px]" : "text-[9px]")}>
				{mark}
			</Text>
		</View>
	);
}

function CloseDetailButton({ onPress }: { onPress: () => void }) {
	return (
		<Pressable
			accessibilityLabel="Close details"
			accessibilityRole="button"
			className="items-center justify-center border border-border"
			onPress={onPress}
			style={{ width: 22, height: 22, borderRadius: 4 }}
		>
			<Text className="text-xs text-muted-foreground">×</Text>
		</Pressable>
	);
}

function StatTile({
	label,
	value,
	valueClass,
}: {
	label: string;
	value: string;
	valueClass: string;
}) {
	return (
		<View className="flex-1 rounded border border-border bg-muted px-2.5 py-2">
			<Text className="mb-1 text-[9px] font-bold tracking-wider text-muted-foreground">
				{label}
			</Text>
			<Text className={cn("font-mono text-sm font-bold", valueClass)}>{value}</Text>
		</View>
	);
}

function EnrollmentActions({
	status,
	enrollmentId,
	enrollDisabled,
	enrollLabel,
	onEnroll,
	onPause,
	onResume,
}: {
	status: GameLearningStatus;
	enrollmentId?: string;
	enrollDisabled?: boolean;
	enrollLabel: string;
	onEnroll: () => void;
	onPause: (enrollmentId: string) => void;
	onResume: (enrollmentId: string) => void;
}) {
	if (status === "available" || (status === "insufficient-funds" && enrollmentId === undefined)) {
		return (
			<Button
				accessibilityLabel={enrollLabel}
				className="w-full"
				disabled={enrollDisabled}
				onClick={onEnroll}
				size="sm"
			>
				{enrollLabel}
			</Button>
		);
	}

	if (status === "active" && enrollmentId !== undefined) {
		return (
			<Button
				className="w-full"
				onClick={() => {
					onPause(enrollmentId);
				}}
				size="sm"
				variant="outline"
			>
				Pause
			</Button>
		);
	}

	if ((status === "paused" || status === "insufficient-funds") && enrollmentId !== undefined) {
		return (
			<Button
				className="w-full"
				disabled={enrollDisabled}
				onClick={() => {
					onResume(enrollmentId);
				}}
				size="sm"
			>
				Resume
			</Button>
		);
	}

	return null;
}

function TechnologyDetail({
	item,
	onClose,
	onStartResearch,
	onPause,
	onResume,
}: {
	item: GameLearningTechnologyItem;
	onClose: () => void;
	onStartResearch: (id: string) => void;
	onPause: (enrollmentId: string) => void;
	onResume: (enrollmentId: string) => void;
}) {
	const statusClass = STATUS_TONE[item.status];

	return (
		<View className="min-h-0 flex-1">
			<View className="flex-row items-center gap-2 border-b border-border px-3 py-2.5">
				<Glyph mark={familyMark(item.family)} size={26} toneClass={familyTone(item.family)} />
				<View className="min-w-0 flex-1">
					<Text className="text-[11px] font-bold text-foreground">{item.name}</Text>
					<Text className="mt-0.5 text-[9px] text-muted-foreground">{item.family}</Text>
				</View>
				<CloseDetailButton onPress={onClose} />
			</View>
			<ScrollView className="min-h-0 flex-1">
				<View className="gap-3.5 p-3">
					<View>
						<Text className="mb-1 text-[9px] font-bold tracking-wider text-muted-foreground">
							STATUS
						</Text>
						<View
							className={cn(
								"flex-row items-center gap-1.5 self-start rounded border px-2 py-0.5",
								statusClass,
							)}
						>
							<View className="h-1.5 w-1.5 rounded-full bg-current" />
							<Text className="text-[10px] font-bold">{statusLabel(item.status)}</Text>
						</View>
					</View>
					<View>
						<Text className="mb-1.5 text-[9px] font-bold tracking-wider text-muted-foreground">
							DESCRIPTION
						</Text>
						<Text className="text-[11px] leading-5 text-muted-foreground">{item.description}</Text>
					</View>
					<View className="flex-row gap-2">
						{item.researchHours === undefined ? null : (
							<StatTile
								label="RESEARCH"
								value={`${String(item.researchHours)}h`}
								valueClass="text-info"
							/>
						)}
						{item.tuitionLabel === undefined ? null : (
							<StatTile label="MONTHLY" value={item.tuitionLabel} valueClass="text-warning" />
						)}
					</View>
					{item.requires.length === 0 ? null : (
						<View>
							<Text className="mb-1.5 text-[9px] font-bold tracking-wider text-muted-foreground">
								REQUIRES
							</Text>
							<View className="flex-row flex-wrap gap-1">
								{item.requires.map((name) => (
									<Text
										className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
										key={name}
									>
										{name}
									</Text>
								))}
							</View>
						</View>
					)}
					<EnrollmentActions
						enrollDisabled={item.enrollDisabled}
						enrollLabel="Start research"
						enrollmentId={item.enrollmentId}
						onEnroll={() => {
							onStartResearch(item.id);
						}}
						onPause={onPause}
						onResume={onResume}
						status={item.status}
					/>
				</View>
			</ScrollView>
		</View>
	);
}

function CourseDetail({
	item,
	onClose,
	onEnrollCourse,
	onPause,
	onResume,
}: {
	item: GameLearningCourseItem;
	onClose: () => void;
	onEnrollCourse: (id: string) => void;
	onPause: (enrollmentId: string) => void;
	onResume: (enrollmentId: string) => void;
}) {
	const tone = courseTone(item.mark);
	const fillClass = tone.split(" ")[0]?.replace("text-", "bg-") ?? "bg-info";

	return (
		<View className="min-h-0 flex-1">
			<View className="flex-row items-center gap-2 border-b border-border px-3 py-2.5">
				<Glyph mark={item.mark} size={26} toneClass={tone} />
				<View className="min-w-0 flex-1">
					<Text className="text-[11px] font-bold text-foreground">{item.name}</Text>
					<Text className="mt-0.5 text-[9px] text-muted-foreground">
						Level {String(item.currentLevel)} / {String(item.maxLevel)}
					</Text>
				</View>
				<CloseDetailButton onPress={onClose} />
			</View>
			<ScrollView className="min-h-0 flex-1">
				<View className="gap-3.5 p-3">
					<View>
						<Text className="mb-1.5 text-[9px] font-bold tracking-wider text-muted-foreground">
							LEVEL PROGRESS
						</Text>
						<View className="flex-row gap-1">
							{Array.from({ length: item.maxLevel }, (_, index) => (
								<View
									className={cn(
										"h-1.5 flex-1 rounded-sm",
										index < item.currentLevel ? fillClass : "bg-border",
									)}
									key={String(index)}
								/>
							))}
						</View>
					</View>
					<View>
						<Text className="mb-1.5 text-[9px] font-bold tracking-wider text-muted-foreground">
							EFFECT
						</Text>
						<Text className="text-[11px] leading-5 text-muted-foreground">{item.effect}</Text>
					</View>
					<View className="flex-row gap-2">
						<StatTile label="TUITION" value={item.tuitionLabel} valueClass="text-warning" />
						<StatTile label="DURATION" value={item.durationLabel} valueClass="text-foreground" />
					</View>
					<EnrollmentActions
						enrollDisabled={item.enrollDisabled}
						enrollLabel={`Enroll — ${item.tuitionLabel}`}
						enrollmentId={item.enrollmentId}
						onEnroll={() => {
							onEnrollCourse(item.id);
						}}
						onPause={onPause}
						onResume={onResume}
						status={item.status}
					/>
				</View>
			</ScrollView>
		</View>
	);
}

function TechnologyRow({
	item,
	onPress,
}: {
	item: GameLearningTechnologyItem;
	onPress: () => void;
}) {
	const lampClass =
		item.status === "completed"
			? "bg-primary shadow-glow-primary"
			: item.status === "available" || item.status === "active"
				? "bg-info shadow-glow-info"
				: "bg-border";

	return (
		<Pressable
			accessibilityLabel={item.name}
			accessibilityRole="button"
			className="w-full flex-row items-center gap-2.5 border-b border-border px-3 py-2.5"
			onPress={onPress}
		>
			<Glyph mark={familyMark(item.family)} size={28} toneClass={familyTone(item.family)} />
			<View className="min-w-0 flex-1">
				<Text className="text-[11px] font-bold leading-4 text-foreground">{item.name}</Text>
				<Text className="mt-0.5 text-[9px] text-muted-foreground">{item.family}</Text>
			</View>
			{item.researchHours === undefined ? (
				<View className={cn("h-1.5 w-1.5 rounded-full", lampClass)} />
			) : (
				<Text
					className={cn(
						"rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold",
						familyTone(item.family),
					)}
				>
					{String(item.researchHours)}h
				</Text>
			)}
		</Pressable>
	);
}

function CourseRow({ item, onPress }: { item: GameLearningCourseItem; onPress: () => void }) {
	const tone = courseTone(item.mark);
	const fillClass = tone.split(" ")[0]?.replace("text-", "bg-") ?? "bg-info";

	return (
		<Pressable
			accessibilityLabel={item.name}
			accessibilityRole="button"
			className="w-full flex-row items-center gap-2.5 border-b border-border px-3 py-2.5"
			onPress={onPress}
		>
			<Glyph mark={item.mark} size={28} toneClass={tone} />
			<View className="min-w-0 flex-1">
				<Text className="text-[11px] font-bold leading-4 text-foreground">{item.name}</Text>
				<View className="mt-1 flex-row gap-0.5">
					{Array.from({ length: item.maxLevel }, (_, index) => (
						<View
							className={cn(
								"h-0.5 w-3.5 rounded-sm",
								index < item.currentLevel ? fillClass : "bg-border",
							)}
							key={String(index)}
						/>
					))}
				</View>
			</View>
			<Text className={cn("rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold", tone)}>
				L{String(item.currentLevel)}
			</Text>
		</Pressable>
	);
}

function GameLearningPanel({
	technologies,
	courses,
	ongoing,
	onStartResearch,
	onEnrollCourse,
	onPause,
	onResume,
}: GameLearningPanelProps) {
	const [tab, setTab] = useState<GameLearningTab>("technologies");
	const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
	const selectedTech = technologies.find((item) => item.id === selectedTechId);
	const selectedCourse = courses.find((item) => item.id === selectedCourseId);

	if (selectedTech !== undefined) {
		return (
			<TechnologyDetail
				item={selectedTech}
				onClose={() => {
					setSelectedTechId(null);
				}}
				onPause={onPause}
				onResume={onResume}
				onStartResearch={onStartResearch}
			/>
		);
	}

	if (selectedCourse !== undefined) {
		return (
			<CourseDetail
				item={selectedCourse}
				onClose={() => {
					setSelectedCourseId(null);
				}}
				onEnrollCourse={onEnrollCourse}
				onPause={onPause}
				onResume={onResume}
			/>
		);
	}

	return (
		<View className="min-h-0 flex-1">
			<View className="shrink-0 border-b border-border bg-muted px-3 py-2">
				<Text className="mb-1 text-[9px] font-bold tracking-wider text-muted-foreground">
					ONGOING
				</Text>
				{ongoing.length === 0 ? (
					<Text className="text-[10px] italic text-muted-foreground">No active study</Text>
				) : (
					<View className="gap-2">
						{ongoing.map((item) => (
							<View className="flex-row items-center gap-2" key={item.id}>
								<Glyph mark={item.mark} size={24} toneClass={courseTone(item.mark)} />
								<View className="min-w-0 flex-1">
									<Text className="text-[11px] font-bold text-foreground">{item.name}</Text>
									<Text className="mt-0.5 text-[9px] text-muted-foreground">{item.detail}</Text>
								</View>
								<View className="h-1.5 w-1.5 rounded-full bg-warning shadow-glow-warning" />
							</View>
						))}
					</View>
				)}
			</View>
			<View className="shrink-0 flex-row border-b border-border">
				{(["technologies", "courses"] as const).map((value) => {
					const selected = tab === value;

					return (
						<Pressable
							accessibilityRole="tab"
							accessibilityState={{ selected }}
							className={cn(
								"h-8 flex-1 items-center justify-center border-b-2",
								value === "technologies" && "border-r border-r-border",
								selected ? "border-b-primary bg-muted" : "border-b-transparent",
							)}
							key={value}
							onPress={() => {
								setTab(value);
							}}
						>
							<Text
								className={cn(
									"text-[9px] font-bold uppercase tracking-wider",
									selected ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{value === "technologies" ? "Technologies" : "Courses"}
							</Text>
						</Pressable>
					);
				})}
			</View>
			<ScrollView className="min-h-0 flex-1">
				{tab === "technologies"
					? technologies.map((item) => (
							<TechnologyRow
								item={item}
								key={item.id}
								onPress={() => {
									setSelectedTechId(item.id);
								}}
							/>
						))
					: courses.map((item) => (
							<CourseRow
								item={item}
								key={item.id}
								onPress={() => {
									setSelectedCourseId(item.id);
								}}
							/>
						))}
			</ScrollView>
		</View>
	);
}

export { GameLearningPanel };

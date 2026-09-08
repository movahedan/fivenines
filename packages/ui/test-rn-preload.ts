import { mock } from "bun:test";

import { createElement, type ReactNode } from "react";
import * as ReactNativeWeb from "react-native-web";

mock.module("react-native", () => ({
	...ReactNativeWeb,
	default: ReactNativeWeb,
}));

mock.module("@rn-primitives/slot", () => ({
	Slot: ({ children }: { children?: ReactNode }) => children ?? null,
}));

mock.module("@rn-primitives/label", () => ({
	Root: ({ children, ...props }: { children?: ReactNode }) =>
		createElement("label", props, children),
	Text: ({ children, ...props }: { children?: ReactNode }) =>
		createElement("span", props, children),
}));

mock.module("lucide-react-native", () => ({
	Eye: () => null,
	EyeOff: () => null,
	Loader2: () => null,
	Pause: () => null,
	Play: () => null,
}));

function MockBox({ children, ...props }: { children?: ReactNode }) {
	return createElement("div", props, children);
}

mock.module("@rn-primitives/progress", () => ({
	Root: MockBox,
	Indicator: MockBox,
}));

mock.module("react-native-reanimated", () => ({
	default: { View: MockBox },
	View: MockBox,
	useAnimatedStyle: () => ({}),
	useDerivedValue: (fn: () => number) => ({ value: fn() }),
	withSpring: (value: unknown) => value,
	interpolate: () => 0,
	Extrapolation: { CLAMP: "clamp" },
}));

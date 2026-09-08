import { createElement, type ReactNode } from "react";

type BoxProps = { readonly children?: ReactNode } & Record<string, unknown>;

function Box({ children, ...rest }: BoxProps) {
	return createElement("div", rest, children);
}

export const Platform = {
	OS: "web" as const,
	select: <T,>(spec: { web?: T; default?: T; native?: T }): T | undefined =>
		spec.web ?? spec.default,
};

export const StyleSheet = {
	create: <T,>(styles: T): T => styles,
	flatten: (style: unknown) => style,
	absoluteFill: {},
	absoluteFillObject: {},
	hairlineWidth: 1,
};

export const Pressable = Box;
export const View = Box;
export const Text = Box;
export const TextInput = Box;
export const ScrollView = Box;
export const Image = Box;
export const ActivityIndicator = Box;
export const Switch = Box;

export default {
	Platform,
	StyleSheet,
	Pressable,
	View,
	Text,
	TextInput,
	ScrollView,
	Image,
	ActivityIndicator,
	Switch,
};

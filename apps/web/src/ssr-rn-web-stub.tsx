import { createElement, type ReactNode } from "react";

type BoxProps = { readonly children?: ReactNode } & Record<string, unknown>;

export function Box({ children, ...rest }: BoxProps) {
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

export const ActivityIndicator = Box;
export const Button = Box;
export const FlatList = Box;
export const Image = Box;
export const ImageBackground = Box;
export const KeyboardAvoidingView = Box;
export const Pressable = Box;
export const ScrollView = Box;
export const Switch = Box;
export const Text = Box;
export const TextInput = Box;
export const TouchableHighlight = Box;
export const TouchableOpacity = Box;
export const TouchableWithoutFeedback = Box;
export const View = Box;
export const VirtualizedList = Box;
export const SafeAreaView = Box;
export const Modal = Box;
export const RefreshControl = Box;
export const SectionList = Box;

export default {
	Platform,
	StyleSheet,
	ActivityIndicator,
	Button,
	FlatList,
	Image,
	ImageBackground,
	KeyboardAvoidingView,
	Pressable,
	ScrollView,
	Switch,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
	VirtualizedList,
	SafeAreaView,
	Modal,
	RefreshControl,
	SectionList,
};

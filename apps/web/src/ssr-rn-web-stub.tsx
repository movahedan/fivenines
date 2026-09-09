import { type ReactNode, createElement as reactCreateElement } from "react";

type BoxProps = { readonly children?: ReactNode } & Record<string, unknown>;

export function Box({ children, ...rest }: BoxProps) {
	return reactCreateElement("div", rest, children);
}

export const createElement = reactCreateElement;
export const unstable_createElement = reactCreateElement;

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

export const PixelRatio = {
	get: (): number => 1,
	getFontScale: (): number => 1,
	getPixelSizeForLayoutSize: (layoutSize: number): number => Math.round(layoutSize),
	roundToNearestPixel: (layoutSize: number): number => layoutSize,
};

const emptyWindow = {
	width: 1024,
	height: 768,
	scale: 1,
	fontScale: 1,
};

function noop(): void {}

export const Dimensions = {
	get: (): typeof emptyWindow => emptyWindow,
	addEventListener: (): { remove: () => void } => ({ remove: noop }),
	removeEventListener: noop,
};

const touchableMixin = {
	touchableHandleStartShouldSetResponder: (): boolean => true,
	touchableHandleResponderTerminationRequest: (): boolean => true,
	touchableHandleResponderGrant: noop,
	touchableHandleResponderMove: noop,
	touchableHandleResponderRelease: noop,
	touchableHandleResponderTerminate: noop,
	touchableGetInitialState: (): Record<string, never> => ({}),
};

export const Touchable = { Mixin: touchableMixin };

export const findNodeHandle = (): null => null;
export const processColor = (color: unknown): unknown => color;
export const render = noop;
export const unmountComponentAtNode = noop;
export const NativeModules: Record<string, never> = {};

export const AccessibilityInfo = {
	addEventListener: () => ({ remove: noop }),
	isScreenReaderEnabled: async () => false,
};
export const Alert = { alert: noop };
export const Appearance = {
	getColorScheme: (): "dark" => "dark",
	addChangeListener: () => ({ remove: noop }),
};
export const AppRegistry = { registerComponent: noop, runApplication: noop };
export const AppState = {
	currentState: "active",
	addEventListener: () => ({ remove: noop }),
};
export const BackHandler = { addEventListener: () => ({ remove: noop }), exitApp: noop };
export const Clipboard = { getString: async () => "", setString: noop };
export const Easing = { linear: (value: number) => value };
export const I18nManager = { isRTL: false, allowRTL: noop, forceRTL: noop };
export const Keyboard = { addListener: () => ({ remove: noop }), dismiss: noop };
export const InteractionManager = { runAfterInteractions: (task?: () => void) => task?.() };
export const LayoutAnimation = { configureNext: noop };
export const Linking = {
	openURL: async () => undefined,
	addEventListener: () => ({ remove: noop }),
};
export const NativeEventEmitter = class {
	addListener(): { remove: () => void } {
		return { remove: noop };
	}
};
export const PanResponder = { create: () => ({ panHandlers: {} }) };
export const Share = { share: async () => undefined };
export const UIManager = { measure: noop };
export const Vibration = { vibrate: noop };

class AnimatedValue {
	setValue(_value: number): void {}
	interpolate(): this {
		return this;
	}
}

export const Animated = {
	View: Box,
	Text: Box,
	Image: Box,
	ScrollView: Box,
	FlatList: Box,
	createAnimatedComponent: <T,>(component: T): T => component,
	Value: AnimatedValue,
	timing: () => ({ start: (callback?: () => void) => callback?.() }),
	spring: () => ({ start: (callback?: () => void) => callback?.() }),
	event: noop,
};

export const ActivityIndicator = Box;
export const Button = Box;
export const CheckBox = Box;
export const FlatList = Box;
export const Image = Box;
export const ImageBackground = Box;
export const KeyboardAvoidingView = Box;
export const Pressable = Box;
export const ProgressBar = Box;
export const ScrollView = Box;
export const Switch = Box;
export const Text = Box;
export const TextInput = Box;
export const TouchableHighlight = Box;
export const TouchableNativeFeedback = Box;
export const TouchableOpacity = Box;
export const TouchableWithoutFeedback = Box;
export const View = Box;
export const VirtualizedList = Box;
export const SafeAreaView = Box;
export const Modal = Box;
export const RefreshControl = Box;
export const SectionList = Box;
export const Picker = Box;
export const StatusBar = Box;
export const YellowBox = Box;
export const LogBox = Box;
export const DeviceEventEmitter = { addListener: () => ({ remove: noop }) };

export function useColorScheme(): "dark" {
	return "dark";
}

export function useWindowDimensions(): typeof emptyWindow {
	return emptyWindow;
}

export function useLocaleContext(): { direction: "ltr" } {
	return { direction: "ltr" };
}

export default {
	Platform,
	StyleSheet,
	PixelRatio,
	Dimensions,
	Touchable,
	createElement,
	unstable_createElement,
	findNodeHandle,
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
	Animated,
};

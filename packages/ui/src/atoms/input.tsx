import type { ComponentProps } from "react";
import { Platform, TextInput } from "react-native";

import { cn } from "@/utils";

interface InputProps
	extends Omit<ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>, "onChange"> {
	onChange?: (event: { target: { value: string } }) => void;
	disabled?: boolean;
	type?: string;
}

function Input({
	className,
	onChange,
	onChangeText,
	disabled,
	editable,
	type,
	...props
}: InputProps) {
	const isEditable = editable ?? (disabled === undefined ? true : !disabled);

	return (
		<TextInput
			className={cn(
				"dark:bg-input/30 border-input bg-background text-foreground flex h-10 w-full min-w-0 flex-row items-center rounded-md border px-3 py-1 text-base leading-5 shadow-sm shadow-black/5 sm:h-9",
				isEditable === false &&
					cn(
						"opacity-50",
						Platform.select({ web: "disabled:pointer-events-none disabled:cursor-not-allowed" }),
					),
				Platform.select({
					web: cn(
						"placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm",
						"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
						"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
					),
					native: "placeholder:text-muted-foreground/50",
				}),
				className,
			)}
			accessibilityState={{ disabled: disabled === true }}
			aria-disabled={disabled === true}
			editable={isEditable}
			keyboardType={type === "email" ? "email-address" : undefined}
			onChangeText={(value) => {
				onChangeText?.(value);
				onChange?.({ target: { value } });
			}}
			secureTextEntry={type === "password"}
			{...props}
		/>
	);
}

export type { InputProps };
export { Input };

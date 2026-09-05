import type { ComponentProps } from "react";

import { Input as AtomInput } from "../../atoms/input";

export interface InputProps extends Omit<ComponentProps<typeof AtomInput>, "onChange"> {
	onChange?: (event: { target: { value: string } }) => void;
	disabled?: boolean;
	type?: string;
}

function Input({ onChange, onChangeText, disabled, editable, type, ...props }: InputProps) {
	return (
		<AtomInput
			accessibilityState={{ disabled: disabled === true }}
			aria-disabled={disabled === true}
			editable={editable ?? (disabled === undefined ? true : !disabled)}
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

export { Input };

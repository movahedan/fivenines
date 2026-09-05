import type { ReactNode } from "react";
import { Children } from "react";

import {
	Button as AtomButton,
	type ButtonProps as AtomButtonProps,
	buttonTextVariants,
	buttonVariants,
} from "../../atoms/button";
import { Text } from "../../atoms/text";

export interface ButtonProps extends AtomButtonProps {
	asChild?: boolean;
	onClick?: AtomButtonProps["onPress"];
	type?: string;
	children?: ReactNode;
}

function wrapChild(child: ReactNode): ReactNode {
	if (typeof child === "string" || typeof child === "number") {
		return <Text>{child}</Text>;
	}
	return child;
}

function Button({ asChild, onClick, onPress, children, type: _type, ...props }: ButtonProps) {
	const content = asChild ? children : Children.map(children, wrapChild);

	return (
		<AtomButton onPress={onPress ?? onClick} {...props}>
			{content}
		</AtomButton>
	);
}

export { Button, buttonTextVariants, buttonVariants };

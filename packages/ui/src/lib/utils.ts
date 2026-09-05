import type { ClassValue } from "clsx";

import { cn as mergeClassNames } from "@packages/utils/cn";

export function cn(...inputs: ClassValue[]): string {
	return mergeClassNames(...inputs);
}

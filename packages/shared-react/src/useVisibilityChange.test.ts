import { describe, expect, it, jest } from "bun:test";

import { act, renderHook } from "@testing-library/react";

import { useVisibilityChange } from "./useVisibilityChange";

describe("useVisibilityChange - document visibility", () => {
	it("invokes the callback when visibilitychange fires", () => {
		const callback = jest.fn<(hidden: boolean) => void>();
		renderHook(() => useVisibilityChange(callback, [callback]));

		expect(callback).not.toHaveBeenCalled();

		act(() => {
			Object.defineProperty(document, "hidden", { configurable: true, value: true });
			document.dispatchEvent(new Event("visibilitychange"));
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(true);
	});

	it("replaces the listener when deps change", () => {
		const first = jest.fn<(hidden: boolean) => void>();
		const second = jest.fn<(hidden: boolean) => void>();
		let callback = first;

		const { rerender } = renderHook(() => useVisibilityChange(callback, [callback]));

		callback = second;
		rerender();

		act(() => {
			Object.defineProperty(document, "hidden", { configurable: true, value: false });
			document.dispatchEvent(new Event("visibilitychange"));
		});

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledWith(false);
	});
});

"use client";

import { useState } from "react";

export function CounterButton() {
	const [count, setCount] = useState(0);

	return (
		<div className="bg-muted rounded-lg p-6 font-medium">
			<p className="m-0 mb-6">
				This component is from <code className="px-1 py-0.5 bg-primary/10 rounded">ui</code>
			</p>
			<div>
				<button
					onClick={() => {
						setCount((c) => c + 1);
					}}
					className="bg-primary text-primary-foreground border-none px-4 py-2 rounded inline-block cursor-pointer"
					type="button"
				>
					Count: {count}
				</button>
			</div>
		</div>
	);
}

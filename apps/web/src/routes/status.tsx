import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/status")({
	component: StatusPage,
});

export function StatusPage() {
	const timestamp = new Date().toISOString();

	return (
		<main>
			<h1>ok</h1>
			<time dateTime={timestamp}>{timestamp}</time>
		</main>
	);
}

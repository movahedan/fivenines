import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	ssr: false,
	component: HomePage,
});

function HomePage() {
	return (
		<main>
			<h1>Five Nines</h1>
			<p>
				<a href="/hub">Play</a>
			</p>
			<p>
				<a href="/lab">Lab</a>
			</p>
		</main>
	);
}

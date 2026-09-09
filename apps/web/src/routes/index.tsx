import { createFileRoute } from "@tanstack/react-router";

import { SiteChrome } from "../components/site-chrome";
import { pageHead } from "./-page-head";

const STEPS = [
	{
		title: "Stand up capacity",
		body: "Buy or lease servers from the market. Cash, opex, and jail are the kernel’s rules — the hub only shows them.",
	},
	{
		title: "Take contracts",
		body: "Incoming projects want a box and a region. Accept, park, or decline. SLA is a 168-hour window, not a vibe.",
	},
	{
		title: "Close the week",
		body: "PAYG accrues as you serve. Week close credits the wallet. Miss the target badly enough and you pay it back.",
	},
] as const;

const FAQ = [
	{
		q: "What is Five Nines?",
		a: "A cloud tycoon. You run capacity against demand and SLA. Play is the hub; the wiki is the product pitch.",
	},
	{
		q: "Where do I actually play?",
		a: "Play opens /hub in this same app. Lab is the verbose engine harness. Both talk to auth and Nest from the browser.",
	},
	{
		q: "Is this a live cloud?",
		a: "No. The simulation kernel runs in the browser for now. Nest campaign/SSE is later. Legal pages are honest placeholders until we collect real player data.",
	},
] as const;

export function HomePage() {
	return (
		<SiteChrome>
			<section className="max-w-3xl space-y-6">
				<p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
					Cloud tycoon
				</p>
				<h1 className="text-4xl font-semibold tracking-tight">Five Nines</h1>
				<p className="text-lg leading-8 text-muted-foreground">
					Keep the lights on. Hit the nines. The ops floor is the game — capacity, contracts, cash,
					and SLA in one console.
				</p>
				<p>
					<a
						className="inline-flex rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
						href="/hub"
					>
						Play
					</a>
				</p>
			</section>
			<section className="mt-16 max-w-3xl" aria-labelledby="how-it-works">
				<h2 className="text-2xl font-semibold tracking-tight" id="how-it-works">
					How it works
				</h2>
				<ol className="mt-6 space-y-6">
					{STEPS.map((step, index) => (
						<li key={step.title}>
							<p className="font-medium">
								{index + 1}. {step.title}
							</p>
							<p className="mt-1 text-muted-foreground">{step.body}</p>
						</li>
					))}
				</ol>
			</section>
			<section className="mt-16 max-w-3xl" aria-labelledby="faq">
				<h2 className="text-2xl font-semibold tracking-tight" id="faq">
					FAQ
				</h2>
				<div className="mt-6 space-y-3">
					{FAQ.map((item) => (
						<details className="rounded-md border border-border px-4 py-3" key={item.q}>
							<summary className="cursor-pointer font-medium">{item.q}</summary>
							<p className="mt-2 text-muted-foreground">{item.a}</p>
						</details>
					))}
				</div>
			</section>
		</SiteChrome>
	);
}

export const Route = createFileRoute("/")({
	ssr: false,
	head: () =>
		pageHead({
			title: "Five Nines",
			description: "Cloud tycoon ops console. Play at /hub — capacity, contracts, cash, and SLA.",
			path: "/",
		}),
	component: HomePage,
});

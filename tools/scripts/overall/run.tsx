import { $ } from "bun";

import { type ReactNode, useCallback } from "react";

import { renderAndExit } from "../shared/render-and-exit";
import { StepProgressApp, type StepProgressStep } from "../shared/step-progress";

export interface OverallOptions {
	readonly quiet: boolean;
	readonly coverage: boolean;
}

interface ShellResult {
	readonly exitCode: number | null;
	readonly stdout: Buffer;
	readonly stderr: Buffer;
}

function assertShellOk(phase: string, result: ShellResult): void {
	if (result.exitCode === 0) {
		return;
	}
	const stderr = result.stderr.toString("utf8").trimEnd();
	const stdout = result.stdout.toString("utf8").trimEnd();
	const chunks: string[] = [];
	if (stderr.length > 0) {
		chunks.push(stderr);
	}
	if (stdout.length > 0) {
		chunks.push(stdout);
	}
	const detail = chunks.length > 0 ? `\n${chunks.join("\n\n")}` : "";
	throw new Error(`${phase} failed (exit ${result.exitCode ?? "unknown"})${detail}`);
}

function getOverallSteps(options: OverallOptions): readonly StepProgressStep[] {
	return [
		{
			label: "Lint (write)",
			run: async () => {
				assertShellOk("Lint", await $`bun run lint -- --fix --unsafe`.nothrow().quiet());
			},
		},
		{
			label: "Typecheck (affected)",
			run: async () => {
				assertShellOk(
					"Typecheck",
					await $`bun run turbo run typecheck --affected`.nothrow().quiet(),
				);
			},
		},
		{
			label: "Test (packages and tools)",
			run: async () => {
				const result = options.coverage
					? await $`bun test packages tools --coverage --coverage-reporter=lcov`.nothrow().quiet()
					: await $`bun test packages tools`.nothrow().quiet();
				assertShellOk("Test packages/tools", result);
			},
		},
		{
			label: "Test (nestjs)",
			run: async () => {
				assertShellOk("Test nestjs", await $`bun --cwd apps/nestjs run test`.nothrow().quiet());
			},
		},
		{
			label: "Test (affected)",
			run: async () => {
				assertShellOk("Test", await $`bun run turbo run test --affected`.nothrow().quiet());
			},
		},
		{
			label: "Build (affected)",
			run: async () => {
				assertShellOk("Build", await $`bun run build --affected`.nothrow().quiet());
			},
		},
	];
}

function OverallApp({ coverage }: { readonly coverage: boolean }): ReactNode {
	const resolveSteps = useCallback(() => getOverallSteps({ quiet: false, coverage }), [coverage]);
	return (
		<StepProgressApp
			completedHeading="Overall quality gate completed"
			resolveSteps={resolveSteps}
		/>
	);
}

export async function runOverall(options: OverallOptions): Promise<void> {
	if (options.quiet) {
		for (const step of getOverallSteps(options)) await step.run();
		return;
	}
	await renderAndExit(<OverallApp coverage={options.coverage} />);
}

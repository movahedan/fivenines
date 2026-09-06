import { Box, render, Text, useApp } from "ink";
import { useEffect } from "react";

function HelpApp({ errorMessage }: { readonly errorMessage?: string }) {
	const { exit, waitUntilRenderFlush } = useApp();

	useEffect(() => {
		void (async () => {
			await waitUntilRenderFlush();
			exit();
		})();
	}, [exit, waitUntilRenderFlush]);

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				bun run overall
			</Text>
			{errorMessage !== undefined ? <Text color="red">{errorMessage}</Text> : null}
			<Text> </Text>
			<Text dimColor>
				Lint (write), affected typecheck/test/build, plus `bun test packages tools` and NestJS
				tests. Lefthook pre-push runs this with --quiet.
			</Text>
			<Text> </Text>
			<Text bold>Flags</Text>
			<Text>
				<Text color="green">--quiet</Text> / <Text color="green">-q</Text> — run steps without Ink
				(pre-push / scripts)
			</Text>
			<Text> </Text>
			<Text bold>Examples</Text>
			<Text dimColor>bun run overall</Text>
			<Text dimColor>bun run overall --quiet</Text>
		</Box>
	);
}

export async function printOverallHelpAndExit(errorMessage?: string): Promise<never> {
	const code = errorMessage === undefined ? 0 : 1;
	const { waitUntilExit, unmount } = render(<HelpApp errorMessage={errorMessage} />);
	await waitUntilExit();
	unmount();
	process.exit(code);
}

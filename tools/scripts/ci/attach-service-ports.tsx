import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { PROD_COMPOSE_FILE } from "../container/stack";
import { resolveServiceHostPorts } from "../shared/compose-service-ports";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function logVerbose(message: string, quiet: boolean): void {
	if (!quiet) {
		console.log(message);
	}
}

export async function runCiAttachServicePorts(rest: readonly string[]): Promise<void> {
	const { values } = parseArgs({
		args: [...rest],
		options: {
			"output-id": { type: "string", short: "o" },
			quiet: { type: "boolean", short: "q", default: false },
		},
		strict: true,
	});

	const outputId = values["output-id"];
	if (outputId === undefined || outputId === "") {
		console.error("Missing required flag: --output-id (-o)");
		process.exit(1);
	}

	const quiet = values.quiet === true;
	const portMappings = await resolveServiceHostPorts(
		path.resolve(REPO_ROOT, PROD_COMPOSE_FILE),
		REPO_ROOT,
	);
	const githubOutput = process.env.GITHUB_OUTPUT;

	if (githubOutput) {
		const serialized = JSON.stringify(portMappings);
		const output = `${outputId}<<EOF\n${serialized}\nEOF\n`;
		await Bun.write(githubOutput, output);
		logVerbose(`Attached: ${outputId}=${serialized}`, quiet);
	}
}

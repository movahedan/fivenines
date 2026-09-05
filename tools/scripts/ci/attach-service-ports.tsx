import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { EntityCompose } from "intershell";

import { PROD_COMPOSE_FILE } from "../container/stack";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MAX_PORT_MAPPING_LENGTH = 256;
const MAX_ENV_LINE_LENGTH = 4096;

function logVerbose(message: string, quiet: boolean): void {
	if (!quiet) {
		console.log(message);
	}
}

function stripWrappingQuotes(value: string): string {
	if (value.length >= 2) {
		const start = value[0];
		const end = value[value.length - 1];
		if ((start === '"' && end === '"') || (start === "'" && end === "'")) {
			return value.slice(1, -1);
		}
	}
	return value;
}

function parseEnvFileLine(line: string): readonly [string, string] | undefined {
	if (line.length > MAX_ENV_LINE_LENGTH) {
		return undefined;
	}

	const trimmed = line.trim();
	if (trimmed.length === 0 || trimmed.startsWith("#")) {
		return undefined;
	}

	const body = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed;
	const separator = body.indexOf("=");
	if (separator <= 0) {
		return undefined;
	}

	const key = body.slice(0, separator).trim();
	if (key.length === 0 || key.length > 128) {
		return undefined;
	}

	return [key, stripWrappingQuotes(body.slice(separator + 1).trim())];
}

async function applyMissingKeysFromEnvFile(filePath: string): Promise<void> {
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		return;
	}

	const text = await file.text();
	for (const line of text.split("\n")) {
		const parsed = parseEnvFileLine(line);
		if (parsed === undefined) {
			continue;
		}

		const [key, value] = parsed;
		if (process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

export async function loadComposeEnvDefaults(repoRoot: string = REPO_ROOT): Promise<void> {
	await applyMissingKeysFromEnvFile(path.join(repoRoot, ".env"));
	await applyMissingKeysFromEnvFile(path.join(repoRoot, ".env.sample"));
}

function expandComposeSubstitution(input: string, env: NodeJS.ProcessEnv): string {
	if (input.length > MAX_PORT_MAPPING_LENGTH) {
		return input.slice(0, MAX_PORT_MAPPING_LENGTH);
	}

	let output = "";
	let index = 0;

	while (index < input.length) {
		const open = input.indexOf("${", index);
		if (open === -1) {
			output += input.slice(index);
			break;
		}

		output += input.slice(index, open);
		const close = input.indexOf("}", open + 2);
		if (close === -1) {
			output += input.slice(open);
			break;
		}

		const inner = input.slice(open + 2, close);
		const defaultSeparator = inner.indexOf(":-");
		const name = defaultSeparator === -1 ? inner : inner.slice(0, defaultSeparator);
		const fallback = defaultSeparator === -1 ? "" : inner.slice(defaultSeparator + 2);
		const resolved = env[name];
		output += resolved !== undefined && resolved !== "" ? resolved : fallback;
		index = close + 1;
	}

	return output;
}

export async function resolveServiceHostPorts(
	composePath: string = path.resolve(REPO_ROOT, PROD_COMPOSE_FILE),
): Promise<Record<string, number>> {
	await loadComposeEnvDefaults(REPO_ROOT);

	const compose = await new EntityCompose(composePath).getCompose();
	const result: Record<string, number> = {};

	for (const [name, service] of Object.entries(compose.services)) {
		const ports = (service.ports ?? []).map((port) => expandComposeSubstitution(port, process.env));
		const mapping = EntityCompose.parsePortMappings(ports)[0];
		if (mapping === undefined || !Number.isInteger(mapping.host) || mapping.host <= 0) {
			continue;
		}

		result[name] = mapping.host;
	}

	return result;
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
	const portMappings = await resolveServiceHostPorts();
	const githubOutput = process.env.GITHUB_OUTPUT;

	if (githubOutput) {
		const serialized = JSON.stringify(portMappings);
		const output = `${outputId}<<EOF\n${serialized}\nEOF\n`;
		await Bun.write(githubOutput, output);
		logVerbose(`Attached: ${outputId}=${serialized}`, quiet);
	}
}

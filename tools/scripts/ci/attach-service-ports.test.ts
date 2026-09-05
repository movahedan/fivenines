import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveServiceHostPorts } from "../shared/compose-service-ports";
import { runCiAttachServicePorts } from "./attach-service-ports";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PROD_COMPOSE = path.join(REPO_ROOT, "docker-compose.yml");

const PORT_ENV_KEYS = ["WEB_PORT", "UI_PORT", "NESTJS_PORT", "AUTH_PORT", "POSTGRES_PORT"] as const;

const previousPortEnv: Record<string, string | undefined> = {};
const previousGithubOutput = process.env.GITHUB_OUTPUT;
const previousCwd = process.cwd();
const tempDirs: string[] = [];

function snapshotPortEnv(): void {
	for (const key of PORT_ENV_KEYS) {
		previousPortEnv[key] = process.env[key];
	}
}

function restorePortEnv(): void {
	for (const key of PORT_ENV_KEYS) {
		const value = previousPortEnv[key];
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
}

snapshotPortEnv();

afterEach(async () => {
	restorePortEnv();
	process.chdir(previousCwd);

	if (previousGithubOutput === undefined) {
		delete process.env.GITHUB_OUTPUT;
	} else {
		process.env.GITHUB_OUTPUT = previousGithubOutput;
	}

	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir !== undefined) {
			await rm(dir, { recursive: true, force: true });
		}
	}
});

describe("attach-service-ports - compose host port map", () => {
	it("emits nestjs and ui host ports from docker-compose.yml when env defaults apply", async () => {
		process.env.NESTJS_PORT = "3002";
		process.env.UI_PORT = "9000";
		process.chdir(REPO_ROOT);

		const ports = await resolveServiceHostPorts(PROD_COMPOSE);

		expect(ports.nestjs).toBe(3002);
		expect(ports.ui).toBe(9000);
	});

	it("emits web and auth host ports from docker-compose.yml when env defaults apply", async () => {
		process.env.WEB_PORT = "3000";
		process.env.AUTH_PORT = "3001";
		process.chdir(REPO_ROOT);

		const ports = await resolveServiceHostPorts(PROD_COMPOSE);

		expect(ports.web).toBe(3000);
		expect(ports.auth).toBe(3001);
	});

	it("writes a JSON object keyed by compose service name when GITHUB_OUTPUT is set", async () => {
		process.env.WEB_PORT = "3000";
		process.env.AUTH_PORT = "3001";
		process.env.NESTJS_PORT = "3002";
		process.env.UI_PORT = "9000";
		process.chdir(REPO_ROOT);

		const dir = await mkdtemp(path.join(tmpdir(), "attach-service-ports-"));
		tempDirs.push(dir);
		const outputPath = path.join(dir, "github-output");
		process.env.GITHUB_OUTPUT = outputPath;

		await runCiAttachServicePorts(["--output-id", "service-ports", "--quiet"]);

		const text = await Bun.file(outputPath).text();
		const body = text.split("\n")[1];
		expect(body).toBeDefined();
		const parsed: unknown = JSON.parse(body ?? "");
		expect(parsed).toEqual(
			expect.objectContaining({ nestjs: 3002, ui: 9000, web: 3000, auth: 3001 }),
		);
	});

	it("expands compose port default substitution when the variable is unset", async () => {
		delete process.env.NESTJS_PORT;
		delete process.env.UI_PORT;

		const dir = await mkdtemp(path.join(tmpdir(), "attach-service-ports-compose-"));
		tempDirs.push(dir);
		const composePath = path.join(dir, "docker-compose.yml");
		await writeFile(
			composePath,
			[
				"services:",
				"  nestjs:",
				`    ports: ["\${UNSET_NESTJS_PORT:-3002}:\${UNSET_NESTJS_PORT:-3002}"]`,
				"  ui:",
				`    ports: ["\${UNSET_UI_PORT:-9000}:\${UNSET_UI_PORT:-9000}"]`,
				"",
			].join("\n"),
		);

		const ports = await resolveServiceHostPorts(composePath);

		expect(ports).toEqual({ nestjs: 3002, ui: 9000 });
	});
});

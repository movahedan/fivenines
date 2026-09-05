#!/usr/bin/env bun
import path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const port = String(process.env.UI_PORT ?? process.env.PORT ?? 9000);
const host = process.env.HOST ?? "127.0.0.1";
const storybookBin = path.join(packageRoot, "../../node_modules/.bin/storybook");

const proc = Bun.spawn(
	["node", storybookBin, "dev", "--no-open", "--exact-port", "--port", port, "--host", host],
	{
		cwd: packageRoot,
		stdio: ["inherit", "inherit", "inherit"],
		env: { ...process.env, PORT: port, UI_PORT: port, HOST: host },
	},
);

process.exit(await proc.exited);

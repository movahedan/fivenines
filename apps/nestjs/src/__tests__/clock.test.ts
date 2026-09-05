import "reflect-metadata";

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { AddressInfo } from "node:net";

import type { INestApplication } from "@nestjs/common";

import { createTestJwtEnv, type TestJwtEnv } from "./test-jwt-env";

describe("@apps/nestjs clock SSE", () => {
	let env: TestJwtEnv;
	let app: INestApplication;
	let origin: string;

	beforeAll(async () => {
		env = await createTestJwtEnv();
		app = env.app;
		await app.listen(0);
		const address = app.getHttpServer().address() as AddressInfo;
		origin = `http://127.0.0.1:${address.port}`;
	});

	afterAll(async () => {
		await app.close();
	});

	it("GET /api/v1/clock/events emits clock.now again after a second", async () => {
		const controller = new AbortController();
		const response = await fetch(`${origin}/api/v1/clock/events`, {
			headers: { Cookie: `auth_access=${env.accessToken}` },
			signal: controller.signal,
		});

		expect(response.status).toBe(200);

		const reader = response.body?.getReader();
		expect(reader).toBeDefined();
		if (!reader) {
			return;
		}

		const decoder = new TextDecoder();
		let text = "";
		const deadline = Date.now() + 3500;
		while ((text.match(/clock\.now/g) ?? []).length < 2 && Date.now() < deadline) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			text += decoder.decode(value, { stream: true });
		}

		controller.abort();
		await reader.cancel().catch(() => undefined);

		expect((text.match(/clock\.now/g) ?? []).length).toBeGreaterThanOrEqual(2);
	});

	it("GET /api/v1/clock/events accepts Bearer as well as cookies", async () => {
		const controller = new AbortController();
		const response = await fetch(`${origin}/api/v1/clock/events`, {
			headers: { Authorization: `Bearer ${env.accessToken}` },
			signal: controller.signal,
		});
		expect(response.status).toBe(200);
		controller.abort();
		await response.body?.cancel().catch(() => undefined);
	});

	it("GET /api/v1/clock/events without token returns 401", async () => {
		const response = await fetch(`${origin}/api/v1/clock/events`);
		expect(response.status).toBe(401);
		await response.body?.cancel().catch(() => undefined);
	});
});

import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { Request, Response } from "express";

import { log } from "@packages/shared/logger";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { processStatusBody } from "./health/process-status";
import { swaggerSetup } from "./swagger.setup";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule, { logger: false });

	app.useGlobalFilters(new HttpExceptionFilter());

	const server = app.getHttpAdapter().getInstance();
	server.get("/status", (_req: Request, res: Response) => {
		res.status(200).json(processStatusBody());
	});

	app.enableCors({
		origin: (
			process.env.ALLOWED_ORIGINS?.split(",") ?? [
				"http://play.fivenines.com:3000",
				"http://localhost:3000",
				"http://127.0.0.1:3000",
			]
		)
			.map((origin) => origin.trim())
			.filter(Boolean),
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id", "x-actor-id"],
	});

	app.setGlobalPrefix("api");

	await swaggerSetup(app);

	const host = process.env.HOST ?? "0.0.0.0";
	const port = Number(process.env.NESTJS_PORT ?? process.env.PORT ?? 3002);

	if (process.argv.includes("--emit-openapi")) {
		log("OpenAPI emitted; exiting");
		return;
	}

	await app.listen(port, host);
	log(`@apps/nestjs listening on http://${host}:${port}`);
}

try {
	await bootstrap();
} catch (error: unknown) {
	log(`Failed to start @apps/nestjs: ${String(error)}`);
	process.exit(1);
}

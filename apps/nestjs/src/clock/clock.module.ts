import { Module } from "@nestjs/common";

import { ClockController } from "./clock.controller";

@Module({
	controllers: [ClockController],
})
export class ClockModule {}

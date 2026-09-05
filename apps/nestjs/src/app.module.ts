import { Module } from "@nestjs/common";

import { ClockModule } from "./clock/clock.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
	imports: [PrismaModule, HealthModule, ClockModule, TenantsModule],
})
export class AppModule {}

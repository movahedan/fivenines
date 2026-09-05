import { type HealthStatus, HealthStatusSchema } from "./health.model";

export function processStatusBody(): HealthStatus {
	return HealthStatusSchema.parse({
		ok: true,
		timestamp: new Date().toISOString(),
	});
}

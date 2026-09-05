import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

import { BaseDto } from "../common/models/dto.model";

export const ClockNowSchema = z.object({
	at: z.string().datetime(),
});

export type ClockNow = z.infer<typeof ClockNowSchema>;

export class ClockNowDto extends BaseDto {
	@ApiProperty({ format: "date-time", example: "2026-09-04T08:00:00.000Z" })
	readonly at!: string;
}

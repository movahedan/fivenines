import { Controller, Sse, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { interval, map, type Observable, startWith } from "rxjs";

import { SCOPES } from "@packages/auth/contract";

import { ApiStandardErrors } from "../common/api/openapi-responses";
import { RequireScopes } from "../common/decorators/require-scopes.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ScopesGuard } from "../common/guards/scopes.guard";
import { type ClockNow, ClockNowDto, ClockNowSchema } from "./clock.model";

type ClockMessage = {
	readonly type: "clock.now";
	readonly data: ClockNow;
};

@ApiTags("Clock")
@Controller("v1/clock")
@UseGuards(JwtAuthGuard, ScopesGuard)
@RequireScopes(SCOPES.read)
export class ClockController {
	@Sse("events")
	@ApiOperation({ summary: "Server wall-clock as SSE (emits immediately, then every second)" })
	@ApiOkResponse({ type: ClockNowDto })
	@ApiStandardErrors()
	events(): Observable<ClockMessage> {
		return interval(1000).pipe(
			startWith(0),
			map(() => ({
				type: "clock.now",
				data: ClockNowSchema.parse({ at: new Date().toISOString() }),
			})),
		);
	}
}

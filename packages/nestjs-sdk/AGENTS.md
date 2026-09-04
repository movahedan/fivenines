# AGENTS.md

**@packages/nestjs-sdk** — Orval-generated client from `@apps/nestjs` OpenAPI.

## Source of truth

`src/openapi.yaml` is written by `@apps/nestjs` (`swagger.setup.ts` in development). Do not hand-edit generated files under `src/gen/`. Config: `orval.config.ts` (server fetch, client React Query, Zod).

## Regenerate

```bash
# After API DTO or route changes:
cd apps/nestjs && bun run build && NODE_ENV=development bun dist/index.js --emit-openapi
cd ../../packages/nestjs-sdk && bun run generate
bun run typecheck
```

## Exports

| Import | Contents |
|--------|----------|
| `@packages/nestjs-sdk` | Re-exports generated types |
| `@packages/nestjs-sdk/types` | TypeScript types per operation/schema |
| `@packages/nestjs-sdk/zod` | Zod schemas (grouped by OpenAPI tag) |
| `@packages/nestjs-sdk/hooks` | React Query hooks (client mutator) |
| `@packages/nestjs-sdk/server` | Fetch functions (server mutator) |
| `@packages/nestjs-sdk/mutator.client` | Browser `customFetch` via `@packages/http` `fetcher` |
| `@packages/nestjs-sdk/mutator.server` | `customFetch` via `publicServerClient`; also `createServerClient` |

Set `NESTJS_API_URL` (default `http://localhost:3006`) for the server mutator.

## Client (browser)

Wrap the app with [`FetcherSettingsProvider`](../http/AGENTS.md) from `@packages/http/react` **before** using generated hooks (`useHealthControllerGetStatus`, …). The client mutator uses the default `fetcher` from `@packages/http`; apps merge auth via `initialSettings` / `setSettings` (`refreshConfig`, `attachAccessToken`).

## Server (Start loaders, jobs)

Generated functions call `customFetch` → `publicServerClient` (`mode: 'static'`). Pass optional `RequestInit` as the last argument:

```typescript
import { healthControllerGetStatus } from "@packages/nestjs-sdk/server";
import { tenantsControllerListTenants } from "@packages/nestjs-sdk/server";

await healthControllerGetStatus();
await tenantsControllerListTenants(params, {
	headers: { Authorization: `Bearer ${token}` },
});
```

`createServerClient` builds a per-request `Fetcher` when you need `mode: 'server'` outside generated functions.

## Auth refresh (when OpenAPI has auth)

`authRefresh` must use **`createBareFetcher`** from `@packages/http` with the same base settings — never the main client (avoids refresh recursion).

## List responses

List endpoints return `{ list, pageInfo }`. Example fetcher for `useList`:

```typescript
import { tenantsControllerListTenants } from "@packages/nestjs-sdk/server";

export const fetchTenants = (params) =>
	tenantsControllerListTenants(params).then((res) => res.list);
```

Errors throw flat `ApiError` from `@packages/http` (`message`, optional `fields`).

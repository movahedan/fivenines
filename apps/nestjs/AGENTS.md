# AGENTS.md

Guidance for **@apps/nestjs** — multi-tenant feature flags control-plane API (NestJS 11, OpenAPI, Zod).

## Overview

- **Port:** 3006 (`NESTJS_PORT`)
- **Prefix:** `/api` (e.g. `GET /api/v1/health`, `GET /api/v1/tenants`)
- **Infra alias:** `GET /status` (no `/api` prefix)
- **Swagger UI:** `/api/docs` · **OpenAPI JSON:** `/api/docs-json`
- **Auth:** Access JWT from HttpOnly cookie `AUTH_COOKIE_ACCESS` (`auth_access`) **or** `Authorization: Bearer` (M2M/tests). Same JWKS. Dev fallback: `x-tenant-id` when `AUTH_ALLOW_HEADER_TENANT=true`. CORS `credentials: true`; allow `http://play.fivenines.com:3001`.

## API contract (OpenAPI)

| Shape | JSON |
|-------|------|
| List success | `{ list: T[], pageInfo: { currentPage, totalPages, totalItems, pageSize } }` |
| Non-list success | Resource schema at root (no envelope) |
| Error (4xx/5xx) | `{ message?: string, fields?: { field, message }[] }` |

Shared DTOs live under `src/common/api/`. Domain modules add `*ListResponseDto` types that compose `PageInfoDto` + item DTOs.

## Essential commands

```bash
bun run dev              # watch + serve (emits openapi.yaml in development)
bun run build            # tsup → dist/
bun run start            # production entry
bun run typecheck
bun test                 # run from this directory (see bunfig.toml)
bun run openapi:emit     # build + write packages/nestjs-sdk/src/openapi.yaml
```

## Database (Prisma 7 + PostgreSQL)

Same Postgres, two connection strings — only the hostname differs:

| Who runs | Source | Host |
|----------|--------|------|
| `bun run` on your machine | `apps/nestjs/.env` → `DATABASE_URL` | `127.0.0.1` (published `POSTGRES_PORT`) |
| Nest container | `docker-compose.dev.yml` from root `POSTGRES_*` | `postgres` (Compose DNS) |

Credentials live in root `.env` (`POSTGRES_USER` / `PASSWORD` / `DB`). Dev compose must not copy the host `DATABASE_URL` — `127.0.0.1` inside the container is not Postgres.

```bash
bun run db:generate        # prisma client (also runs on postinstall)
bun run db:migrate         # apply migrations (dev)
bun run db:migrate:deploy  # apply migrations (CI/prod)
bun run db:seed            # demo tenant, project, envs, sample flags
bun run db:studio          # Prisma Studio
```

**Seed IDs:** tenant `00000000-0000-4000-8000-000000000001` (slug `demo`), project `00000000-0000-4000-8000-000000000010` (key `main`).

**Models:** `Tenant` → `Project` → `Environment` / `FeatureFlag`; `AuditLog` scoped by tenant (Phase 3 writes).

## OpenAPI → @packages/nestjs-sdk

On dev boot (or `openapi:emit`), `src/swagger.setup.ts` writes `packages/nestjs-sdk/src/openapi.yaml` and runs `bun run generate` (Orval) in that package when the spec changes.

```bash
cd apps/nestjs && bun run build && NODE_ENV=development bun dist/index.js --emit-openapi
cd ../../packages/nestjs-sdk && bun run generate
```

## Auth integration (`@apps/auth`)

Nest validates **human JWTs** via JWKS (`jose` + `AUTH_JWKS_URL`) — cookie or Bearer, no HTTP call to auth per request.

| Variable | Purpose |
|----------|---------|
| `AUTH_JWKS_URL` | e.g. `http://localhost:3007/.well-known/jwks.json` (compose: `host.docker.internal`) |
| `AUTH_ISSUER` | Must match JWT `iss` (local default `http://auth.fivenines.com:3007`) |
| `AUTH_AUDIENCE` | Human/mgmt tokens: `fivenines-api` |
| `AUTH_COOKIE_ACCESS` | Cookie name for the access JWT (default `auth_access`) |
| `AUTH_ALLOW_HEADER_TENANT` | `true` in dev only — skip JWT, use `x-tenant-id` |

Protected today: `GET /api/v1/tenants` (`JwtAuthGuard` + `feature-flags:read`).

**E2e note:** Auth and Nest seeds share demo tenant id `00000000-0000-4000-8000-000000000001`. Compose `nestjs` injects `AUTH_JWKS_URL` (via `host.docker.internal`), `AUTH_ISSUER`, `AUTH_AUDIENCE`, and `AUTH_COOKIE_ACCESS`.

## Docker

The compose `nestjs` service generates the Prisma client into the container `node_modules` volume (install uses `--ignore-scripts`, so `postinstall` does not run), then `migrate deploy` and seed.

```bash
bun run container up -- --profile nestjs   # postgres + @apps/nestjs
curl -sf http://localhost:3006/status
```

Combined with auth: `bun run container up -- --profile auth --profile nestjs` (see [CHEATSHEET.md](../../docs/CHEATSHEET.md#auth--nestjs-smoke)).

## Layout

```
apps/nestjs/src/
  common/api/       # PageInfo, ApiError, ListQuery, OpenAPI helpers
  common/guards/    # JwtAuthGuard, ScopesGuard, TenantGuard (legacy header)
  health/           # Health checks
  prisma/           # PrismaService (global)
  tenants/          # Stub list endpoint (JWT-protected; Prisma wiring in Phase 3)
  swagger.setup.ts
  index.ts
```

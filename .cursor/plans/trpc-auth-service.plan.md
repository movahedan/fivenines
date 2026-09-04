---
name: tRPC auth service
overview: "Milestone 1 delivered in repo: @packages/auth-contract + @apps/auth (human JWT, refresh, M2M, login UI) + Nest JwtAuthGuard (PR4). Follow-up: e2e glue, aligned seeds, Nest M2M client. Eval app out of scope."
todos:
  - id: phase-1-scaffold
    content: "PR1: auth-contract + apps/auth canonical layout, Prisma migrate, Bun.serve stubs, SSR/action spike"
    status: completed
  - id: phase-1-verify
    content: "PR1 gate: turbo build/typecheck, db:migrate, container profile auth, curl status/login/api stubs, overall"
    status: completed
  - id: phase-1-docs
    content: "PR1 docs: apps/auth AGENTS, auth-contract AGENTS, root AGENTS row :3007, CHEATSHEET auth profile"
    status: completed
  - id: phase-2-core
    content: "PR2: trpc/auth procedures, server actions wrappers, /api/refresh, /api/token M2M, JWKS, seed, tests"
    status: completed
  - id: phase-2-verify
    content: "PR2 gate: bun test apps/auth, seed, overall"
    status: completed
  - id: phase-2-docs
    content: "PR2 docs: apps/auth README (JWT, /api/*, refresh, token, product flows, Nest verify)"
    status: completed
  - id: phase-3-ui
    content: "PR3: SSR login/logout pages, CSRF, compose healthcheck, manual smoke"
    status: completed
  - id: phase-3-verify
    content: "PR3 gate: manual login + refresh + overall"
    status: completed
  - id: phase-3-docs
    content: "PR3 docs: README browser flow, CHEATSHEET seed creds"
    status: completed
  - id: phase-4-nest
    content: "PR4: Nest JwtAuthGuard + ScopesGuard, AUTH_* env, dev header fallback"
    status: completed
  - id: followup-register-otp
    content: "Register + email OTP (SSR + tRPC); AUTH_OTP_LOG dev path — SMTP still out of scope"
    status: completed
  - id: followup-e2e
    content: "Align auth/nest demo tenant UUIDs; AUTH_* on nestjs compose service; documented auth→Nest smoke"
    status: pending
  - id: followup-m2m-nest
    content: "Persist M2M dev keys for nestjs-control-plane; Nest outbound token client + cache"
    status: pending
  - id: followup-auth-tests
    content: "Human login/refresh tests; optional cross-service supertest (real JWKS)"
    status: pending
isProject: false
---

# tRPC-auth microservice (finalized)

**Related:** [nestjs-feature-flags-control-plane.plan.md](nestjs-feature-flags-control-plane.plan.md) · Smoke: [CHEATSHEET.md](../../docs/CHEATSHEET.md#auth--nestjs-smoke)

## Done

Milestone 1 is in the repo: `@packages/auth-contract` and `@apps/auth` (:3007) issue human and machine JWTs (RS256 + JWKS); Nest (:3006) validates inbound tokens via `AUTH_JWKS_URL` without calling auth per request.

- Shared scopes (`admin` / `write` / `read`) and `hasScope()` hierarchy
- Human auth: tRPC `auth.login`, sessions, `POST /api/refresh`, access JWT with `tid` + `scopes`
- M2M: `POST /api/token`, seed client `nestjs-control-plane`, `m2m-token.test.ts`
- Browser: `/login`, `/logout`, CSRF; `/register` and `/otp` (dev OTP log, no SMTP)
- Nest: `JwtAuthGuard` + `ScopesGuard` on management routes
- Compose `profile auth`, docs (`README`, `AGENTS`, `.env.sample`)

## Remaining

- Align demo tenant UUID between auth seed (`…0010`) and Nest seed (`…0001`)
- Wire `AUTH_JWKS_URL` / `AUTH_ISSUER` / `AUTH_AUDIENCE` on the `nestjs` compose service
- Nest outbound M2M: persist machine private key + token client/cache
- Human login/refresh tests; optional live auth→Nest integration test
- Production hardening: `AUTH_ALLOW_HEADER_TENANT=false`, no revocation/introspection yet

**Deferred:** eval app, OIDC, `client_secret` grant, magic link email send.

---

## Product flows (final)

| Actor | Auth | Scopes (via role) | Calls |
|--------|------|-------------------|--------|
| **Tenant admin / owner** | Human login @ auth | `feature-flags:admin`, `feature-flags:write`, `feature-flags:read` | **Nest** management API |
| **Tenant member** | Human login | `feature-flags:read` | Read/eval paths only (not Nest admin CRUD) |
| **Nest (no user)** | **M2M** `POST /api/token` (**Milestone 1 PR2**) | `feature-flags:read` (seed client) | Nest or future eval when resolving flag values |
| **App BFF** | User session → user's JWT | User's scopes | Same APIs as browser |

**Scopes (only these three):** `feature-flags:admin` · `feature-flags:write` · `feature-flags:read` — no `feature-flags:evaluate`.

**Management:** JWT `aud=fivenines-api` → Nest (Phase 4 guard checks scope per route). **M2M is in milestone 1** (not deferred): working `/api/token` + tests in **PR2**.

```mermaid
flowchart LR
  auth[@apps/auth :3007]
  nest[Nest :3006]
  auth -->|JWKS| nest
  Admin -->|JWT admin write read| nest
  Member -->|JWT read| nest
  Nest -->|M2M JWT read via api/token| auth
  Nest -->|Bearer| nest
```

---

## Finalized defaults (was open questions)

| Topic | Decision |
|-------|----------|
| Eval `aud` (machine) | `AUTH_AUDIENCE_EVAL` env, default **`fivenines-eval`** |
| Human `aud` | `AUTH_AUDIENCE`, default **`fivenines-api`** |
| Member scopes | **`feature-flags:read` only** |
| Machine JWT `tid` | **Omitted**; tenant/project on downstream API params |
| Scope hierarchy | **`admin` → satisfies `write` and `read`**; **`write` → satisfies `read`** (implement in `@packages/auth-contract` `hasScope()`) |
| `auth.refresh` on tRPC `/api` | **Optional**; HTTP `POST /api/refresh` is primary for browsers |
| Magic link / email | **v1.1** |
| Access JWT TTL | `AUTH_ACCESS_TTL_SECONDS` default **900** (15m) |
| Refresh rotation | **Yes** — new refresh hash on each `/api/refresh` |

### `ROLE_SCOPES` (`@packages/auth-contract`)

| Role | Scopes emitted on JWT |
|------|------------------------|
| `owner` | `feature-flags:admin`, `feature-flags:write`, `feature-flags:read` |
| `admin` | `feature-flags:admin`, `feature-flags:write`, `feature-flags:read` |
| `member` | `feature-flags:read` |

### Scope constants (exhaustive list)

| Scope | Meaning |
|-------|---------|
| `feature-flags:admin` | Tenant-level management (projects, environments, members, destructive ops) |
| `feature-flags:write` | Create/update/delete flags and targeting rules |
| `feature-flags:read` | Read flag values and metadata; **M2M default** for Nest fetching flag state |

**Nest route mapping (Phase 4):** e.g. CRUD flags → `write` or `admin`; list/read → `read`; tenant admin UI → `admin`. Use `hasScope()` with hierarchy above.

---

## Design decisions (locked)

| Topic | Decision |
|-------|----------|
| JWT v1 | RS256 + `GET /.well-known/jwks.json`; opaque refresh in DB |
| Browser | httpOnly session + refresh cookies; access JWT for `Authorization: Bearer` |
| Tenant | `tid` claim; `auth.switchTenant`; Nest Phase 4 reads from JWT only |
| App stack | **Bun.serve** + **Bun bundler**; logic in **`src/trpc/`**; SSR in **`src/pages/`** |
| M2M (**Milestone 1 PR2**) | Private-key client assertion → **`POST /api/token`**; seeded `MachineClient`; tests + README; Nest caches JWT until `exp` |
| API paths | tRPC at **`/api`** (not `/api/trpc`); **`POST /api/refresh`**; **`POST /api/token`** registered **before** `/api/*` |
| Excluded | Next, Vite, TanStack Start, `@apps/vite-spa`, `src/actions/`, `src/server/`, app-root `prisma/` |

---

## Workspace map

| Path | Name | Port |
|------|------|------|
| `apps/auth` | `@apps/auth` | **3007** (`AUTH_PORT`) |
| `packages/auth-contract` | `@packages/auth-contract` | — |
| `apps/nestjs` | `@apps/nestjs` | 3006 (JWT guard Phase 4) |

**Env (auth)** — document in `apps/auth/.env.sample` and root `.env.sample`:

| Variable | Purpose |
|----------|---------|
| `AUTH_PORT` | 3007 |
| `AUTH_ISSUER` | JWT `iss` (e.g. `http://localhost:3007`) |
| `AUTH_AUDIENCE` | Human/mgmt JWT `aud` (`fivenines-api`) |
| `AUTH_AUDIENCE_EVAL` | Optional separate `aud` for machine JWTs (default `fivenines-eval`); same scopes (`read`) |
| `AUTH_DATABASE_URL` | `postgresql://…/fivenines_auth` |
| `AUTH_ACCESS_TTL_SECONDS` | Access JWT lifetime |
| `AUTH_COOKIE_*` | Session/refresh cookie names, secure flags |
| `AUTH_JWT_PRIVATE_KEY` / `AUTH_JWT_PUBLIC_KEY` | Signing (dev PEM paths; prod env) |

**Nest (Phase 4):** `AUTH_ISSUER`, `AUTH_JWKS_URL`, `AUTH_AUDIENCE`, `AUTH_ALLOW_HEADER_TENANT=false`.

---

## Repository layout (canonical)

```
apps/auth/
  package.json
  src/
    index.ts
    db.ts
    prisma/
      schema.prisma
      migrations/
      prisma.config.ts
    utils/
      render-page.tsx
    pages/
      login.tsx
      logout.tsx
    trpc/
      init.ts
      context.ts
      router.ts
      handler.ts
      caller.ts
      auth/
        router.ts
        actions.ts      # 'use server'
        refresh.ts
        token.ts        # /api/token HTTP
        m2m.ts
        session.ts
        password.ts
        jwt.ts
        keys.ts
        csrf.ts
    __tests__/
  scripts/
    seed.ts
packages/auth-contract/
  src/scopes.ts          # SCOPES.admin | .write | .read only
  src/jwt-claims.ts
  src/role-scopes.ts     # ROLE_SCOPES + hasScope(required)
  src/index.ts
```

### Prisma models

- `User` — email, passwordHash, emailVerifiedAt, timestamps
- `Tenant` — name, slug
- `TenantMember` — userId, tenantId, role (`owner` | `admin` | `member`)
- `Session` — userId, refreshTokenHash, expiresAt, activeTenantId, revokedAt
- `MachineClient` — clientId, name, publicKeyJwk, allowedScopes[], revokedAt

### `Bun.serve` route order in `index.ts`

1. `GET /status`
2. `GET /.well-known/jwks.json`
3. `POST /api/refresh`
4. `POST /api/token`
5. `GET /login`, `GET /logout` (SSR)
6. `/api/*` → tRPC handler (`endpoint: '/api'`)
7. Server action POST (framework/bundler)

---

## Machine-to-machine (**Milestone 1 — PR2 required**)

Not a future phase. **PR2 must ship:**

- `POST /api/token` — client_credentials + JWT bearer client assertion (RFC 7523)
- `MachineClient` row + seed: `nestjs-control-plane`, `allowedScopes: ['feature-flags:read']`
- `src/__tests__/m2m-token.test.ts` — sign assertion → token → verify JWT scopes/aud
- README: Nest env + in-memory cache until `exp`, then re-assert

Response access JWT: `scopes` ⊆ client allow-list; `sub` = `clientId`; `tid` omitted; `aud` = `AUTH_AUDIENCE_EVAL` or `AUTH_AUDIENCE` per env.

---

## Phase 1 — PR1: Scaffold + spike

**Goal:** Workspaces compile; DB migrates; server boots; route stubs; SSR placeholder; noop server action.

**Must:** Canonical layout; `MachineClient` in schema; stub `/api`, `/api/refresh`, `/api/token`; tRPC at `/api`; spike SSR + `trpc/auth/actions.ts` noop.

**Must not:** Real auth; Nest changes; Next/Vite.

### Scouts (builder)

| Scout | Patterns |
|-------|----------|
| Compose | `rg 'NESTJS_PORT|profiles' docker-compose.dev.yml .env.sample` |
| Turbo | `rg '@apps/' package.json turbo.json` |
| Nest guard | `rg 'TenantGuard|x-tenant-id' apps/nestjs/src` |

### Verification

```bash
bun install
bun run turbo run build typecheck --filter=@packages/auth-contract --filter=@apps/auth
cd apps/auth && bun run db:migrate
bun run container up -- --profile auth
curl -sf http://localhost:3007/status
curl -sf http://localhost:3007/login | head
curl -sf -o /dev/null -w "%{http_code}" -X POST http://localhost:3007/api/refresh
curl -sf -o /dev/null -w "%{http_code}" -X POST http://localhost:3007/api/token
bun run overall
```

### Documentation before PR

- `apps/auth/AGENTS.md`, `packages/auth-contract/AGENTS.md`
- Root `AGENTS.md` — `@apps/auth` :3007
- `docs/CHEATSHEET.md` — `bun run container up -- --profile auth`

---

## Phase 2 — PR2: Auth core + M2M + tests

**Goal:** Human auth complete via tRPC + actions; `/api/refresh`; `/api/token` (M2M); JWKS; seed user + machine client; tests.

**Procedures:** `auth.login`, `logout`, `me`, `switchTenant` (optional `auth.refresh` → `refresh.ts`).

**Must:** Single logic path — actions call `createCaller`; rate-limited login; generic errors; no secrets in logs.

**Must (M2M):** Full `/api/token` implementation + seed machine client + `m2m-token.test.ts` (not stub).

### Verification

```bash
cd apps/auth && bun run db:seed
bun test apps/auth/src/__tests__
# M2M smoke (README documents full curl):
# POST /api/token with client_assertion → access_token with feature-flags:read
bun run overall
```

### Documentation before PR

- `apps/auth/README.md` — product flows, JWT claims, `ROLE_SCOPES`, curl examples, Nest + eval contracts

---

## Phase 3 — PR3: Login UI + CSRF

**Goal:** SSR `/login`, `/logout`; forms → `trpc/auth/actions`; CSRF; compose healthcheck.

### Verification

```bash
bun run container up -- --profile auth
# Manual: GET /login → POST → cookies; POST /api/refresh; POST /api/token (M2M) per README
bun run overall
```

### Documentation before PR

- `apps/auth/README.md` — browser flow, cookies, CSRF
- `docs/CHEATSHEET.md` — seed admin email/password via env

---

## Phase 4 — PR4: Nest JWT guard (post–milestone 1)

**Goal:** `@apps/nestjs` validates human JWTs on management routes.

**Must:**

- `JwtAuthGuard` + `@RequireScopes()` per route (`admin` / `write` / `read` via `hasScope` hierarchy)
- `request.tenantId` ← `tid`, `request.actorId` ← `sub`
- `jose` + `AUTH_JWKS_URL` / `AUTH_ISSUER` / `AUTH_AUDIENCE`
- `x-tenant-id` only if `NODE_ENV=development` && `AUTH_ALLOW_HEADER_TENANT=true`
- supertest: valid token, wrong scope, expired token

**Must not:** Duplicate auth DB in Nest.

### Verification

```bash
# Login at auth → Bearer to Nest
bun test apps/nestjs/src/__tests__/auth-guard.test.ts
bun run overall
```

### Documentation before PR

- `apps/nestjs/AGENTS.md` — auth env, scope requirements
- `apps/auth/README.md` — cross-link Nest setup

---

## Out of scope

- Eval/data-plane **application**
- Magic link, email verification send, OIDC provider, `client_secret` M2M
- M2M key admin UI (seed/env only)
- Token revocation / introspection
- OpenAPI for auth (tRPC + `auth-contract` types)

---

## PR sequence

| PR | Deliverable | Gate | Status |
|----|-------------|------|--------|
| **PR1** | Scaffold + contract + Prisma + compose + spike | Phase 1 verify | **Done** |
| **PR2** | Auth + refresh + **M2M /api/token** + JWKS + seed + tests | Phase 2 verify + overall | **Done** (M2M test; human tests follow-up) |
| **PR3** | Login/logout SSR + CSRF | Phase 3 verify + manual smoke | **Done** |
| **PR4** | Nest JWT guard | Phase 4 verify | **Done** |
| **Follow-up** | E2E smoke, seed alignment, Nest M2M client | Manual + optional integration test | **Pending** |

---

## Risk summary

| Risk | Mitigation |
|------|------------|
| Route shadowing under `/api/*` | Fixed route order in `index.ts` |
| Logic outside `trpc/` | `rg 'prisma' apps/auth/src/pages` empty in CI |
| Bun server actions | PR1 spike; actions colocated in `trpc/auth/actions.ts` |
| Wrong scope on route | `hasScope` hierarchy; tests per scope; M2M limited to `read` on seed client |
| Tenant IDs on machine JWT | Omitted by default; explicit eval API params |

---

## Dependency policy

- `@packages/auth-contract` — no app deps
- `@apps/auth` → `auth-contract`, `@packages/utils` (logger)
- `@apps/nestjs` → `auth-contract` + `jose` (Phase 4 only)
- No `@apps/auth` import in Nest

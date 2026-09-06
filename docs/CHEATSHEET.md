# Command cheatsheet

Run from repo root. Filters use workspace `name` (`@apps/nestjs`, `@packages/ui`, …). CLIs live under `tools/scripts/`. Setup: [README § Quick start](../README.md#quick-start) · Map: [AGENTS.md](../AGENTS.md).

## Bootstrap

| Command | Description |
|---------|-------------|
| `bun install` | Install deps + lefthook |
| `bun run local setup` | Install, lint, typecheck, test, build |
| `bun run local setup -- --skip-tests` | Setup without tests |
| `bun run local vscode` | Regenerate VS Code workspace settings |
| `bun run local cleanup` | Remove artifacts / `node_modules` |
| `bun run nuke` | Deep clean (then `bun install`) |

## Quality

| Command | Description |
|---------|-------------|
| `bun run overall` | Lint (write) + affected typecheck, test, build |
| `bun run overall -- --quiet` | Same, minimal Ink output |
| `bun run lint` | Biome check |
| `bun run lint -- --write` | Biome fix |
| `bun run typecheck` | Turbo typecheck |
| `bun test` | All tests |
| `bun test <path>` | One test file |
| `bun test --coverage` | Tests + coverage |
| `bun run build` | Turbo build |
| `bun run precommit` | Branch / message / staged checks |

GitHub Actions secrets/variables: [GITHUB_WORKFLOW_ENV.md](GITHUB_WORKFLOW_ENV.md).

## Dev (host)

| Command | Description |
|---------|-------------|
| `bun run turbo run dev --filter=@apps/web` | Player UI (TanStack Start SSR) :3000 |
| `bun run turbo run dev --filter=@apps/nestjs` | Control-plane API :3002 |
| `bun run turbo run dev --filter=@apps/auth` | Auth service :3001 |
| `bun run turbo run dev --filter=@packages/ui` | UI / Storybook :9000 (Node CLI; host vs Docker: one listener) |
| `cd apps/nestjs && bun test` | Nest API tests (use app `bunfig.toml`) |
| `cd packages/nestjs-sdk && bun run generate` | Regenerate Orval SDK from `openapi.yaml` |
| `cd apps/nestjs && bun run db:migrate` | Apply Prisma migrations (needs `DATABASE_URL`) |
| `cd apps/nestjs && bun run db:seed` | Seed demo tenant/project/flags |
| `cd apps/nestjs && bun run db:studio` | Prisma Studio |
| `cd apps/auth && bun test` | Auth tests (needs `db:generate` + `AUTH_DATABASE_URL`) |
| `cd apps/auth && bun run db:migrate` | Auth DB migrations (`AUTH_DATABASE_URL`) |
| `cd apps/auth && bun run db:seed` | Seed admin user + `nestjs-control-plane` M2M client |
| `bun run turbo run build:storybook --filter=@packages/ui` | Build Storybook |
| `bun run build --filter=@packages/ui` | Build one workspace |
| `bun run test --filter=@packages/shared` | Test one workspace |
| `bun run typecheck --filter=@packages/shared-react` | Typecheck shared React hooks |
| `bun run typecheck --filter=@packages/shared-tanstack` | Typecheck TanStack list helpers |
| `bun test packages/shared-react packages/shared-tanstack` | Unit tests for list hooks packages |

## Docker Compose

Hot reload in containers is limited on macOS: bind mounts often do not propagate file-watch events, so Bun/tsup may not restart on save. Vite/Storybook use polling when `CHOKIDAR_USEPOLLING` is set (compose dev stack). For the fastest loop while editing, run the app on the host ([Dev (host)](#dev-host)) and use Docker for Postgres and the full stack.

Local player auth uses **HTTP hostnames** (no mkcert). One `/etc/hosts` line:

```text
127.0.0.1 play.fivenines.com auth.fivenines.com api.fivenines.com
```

Then open `http://play.fivenines.com:3000` (Play), login at `http://auth.fivenines.com:3001`, API at `http://api.fivenines.com:3002`. Cookie `Domain=.fivenines.com`; `AUTH_COOKIE_SECURE=false` locally.

| Command | Description |
|---------|-------------|
| `bun run container setup` | Dev stack setup |
| `bun run container up` | Start dev stack |
| `bun run container down` | Stop dev stack |
| `bun run container check` | Up + health (`GET /status` JSON, 3 retries) |
| `bun run container health` | Health check |
| `bun run container logs` | Logs |
| `bun run container cleanup` | Stop + remove volumes |
| `bun run container install` | `bun install` into the compose `node_modules` volume |
| `bun run container --prod up` | Prod-shaped compose file |
| `bun run container compose -- ps` | `docker compose ps` |
| `bun run container up -- --profile web` | Postgres + Nest + `@apps/web` :3000 |
| `bun run container up -- --profile nestjs` | Postgres + `@apps/nestjs` :3002 |
| `bun run container up -- --profile auth` | Postgres + `@apps/auth` :3001 (migrate + seed) |
| `bun run container up -- --profile auth --profile nestjs` | Both services + Postgres (host dev: set Nest `AUTH_*` in `.env`) |

Process-up probe (JSON): `curl -sf -H 'Accept: application/json' http://localhost:3000/` (web), `:3001/status` (auth), `:3002/status` (nest), `:9000/status` (Storybook). Compose HEALTHCHECK and `bun run container check` use the same contract (`"ok":true`, 3 retries).

### Auth + NestJS smoke

Host dev (two terminals or Turbo filters):

```bash
bun run turbo run dev --filter=@apps/auth --filter=@apps/nestjs
```

Nest needs `AUTH_JWKS_URL`, `AUTH_ISSUER`, `AUTH_AUDIENCE` (see root `.env.sample` and `apps/nestjs/.env.sample`).

**Quick Nest check without JWT** (dev only): `AUTH_ALLOW_HEADER_TENANT=true` then:

```bash
curl -sf -H "x-tenant-id: 00000000-0000-4000-8000-000000000001" \
  http://localhost:3002/api/v1/tenants
```

**Real JWT (browser):** hosts file + login form → 302 to the allowlisted `redirect_uri` (Play sends `/hub`); Nest reads `auth_access` cookie. **M2M/tests:** Bearer still works:

```bash
curl -sf -H "Authorization: Bearer <access_token>" \
  http://localhost:3002/api/v1/tenants
```

## Release & CI

| Command | Description |
|---------|-------------|
| `bun run release prepare` | Plan version bumps + changelog |
| `bun run release apply` | Apply prepared versions |
| `bun run release ci` | CI release workflow |
| `bun run ci attach-affected` | GH output: affected packages |
| `bun run ci attach-service-ports` | GH output: compose ports |
| `bun run export-modules update` | Refresh package export graph |

## Help

| Command | Description |
|---------|-------------|
| `bun run local` | Local subcommands help |
| `bun run container` | Container subcommands help |
| `bun run release` | Release subcommands help |
| `bun run precommit -- --help` | Precommit flags |
| `bun run ci` | CI subcommands help |

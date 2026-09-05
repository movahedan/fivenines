# GitHub Actions — repository secrets and variables

Set these on the **repository** (Settings → Secrets and variables → Actions). Workflows do **not** use a named GitHub Environment (`environment:`) today.

Compose probes in **Check** use image HEALTHCHECKs and `.env.sample` / compose `${VAR:-default}` values. You do **not** need to copy `POSTGRES_*`, ports, or `VITE_*` into GitHub for that job.

## Required for remote Turbo cache

| Name | Kind | Used by | Notes |
|------|------|---------|--------|
| `TURBO_TOKEN` | Secret | Check, Main, Version | [Vercel / Turborepo remote cache](https://turborepo.dev/docs/core-concepts/remote-caching) token. Jobs still run if unset; cache uploads/downloads are skipped. |
| `TURBO_TEAM` | Variable | Check, Main, Version | Turbo team / org slug for the same remote cache. Pair with `TURBO_TOKEN`. |

## Provided by GitHub (do not add)

| Name | Kind | Used by | Notes |
|------|------|---------|--------|
| `GITHUB_TOKEN` | Secret | Check, Main, Version | Automatic. Checkout and `bun run release ci` use it. Do not paste a PAT here unless you intentionally override the default. |

## Not used yet (commented in Main)

Leave unset until image publish is enabled:

| Name | Kind |
|------|------|
| `DOCKER_REGISTRY` | Secret |
| `DOCKER_USERNAME` | Secret |
| `DOCKER_PASSWORD` | Secret |

## Local compose vs Actions

App ports and DB URLs for Docker live in [`.env.sample`](../.env.sample). CI `attach-service-ports` fills missing keys from that file; prod compose interpolates the same defaults. No extra Actions env is required for web `:3000`, auth `:3001`, nest `:3002`, ui `:9000`, or Postgres `:5432`.

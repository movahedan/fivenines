# GitHub Actions — repository secrets and variables

Set these on the **repository** (Settings → Secrets and variables → Actions). Workflows do **not** use a named GitHub Environment (`environment:`) today.

**Check** is production compose for affected services. **Overall** is `bun install` plus `bun run overall` (the same local quality gate). After tests, it converts Bun `lcov` to Cobertura and uploads it with `actions/upload-code-coverage` so the **code coverage** ruleset actually receives data. Do not use `--frozen-lockfile` on `bun install` in this repo. Lefthook **pre-push** still runs `bun run overall -- --quiet` locally.

**CodeQL** (`.github/workflows/codeql.yml`) scans Actions + JS/TS with `security-extended`. It needs no extra secrets or variables.

**Copilot setup** (`.github/workflows/copilot-setup-steps.yml`) installs Bun + deps in Copilot’s ephemeral VM so the agent can run `bun run overall` before commit. Same file is used by Copilot code review unless you add `copilot-code-review.yml`. The **main** ruleset requests Copilot review on every push to a PR (including drafts). Takes effect after it is on `main`. No extra secrets.

**Dependabot** (`.github/dependabot.yml`) opens version-update PRs. No extra secrets. Enable Dependabot **security** updates in Settings → Code security. Uninstall Mend Renovate on this repo after merge so PRs are not duplicated. Notes: [DEPENDABOT.md](DEPENDABOT.md).

Compose probes use image HEALTHCHECKs and `.env.sample` / compose `${VAR:-default}` values. You do **not** need to copy `POSTGRES_*`, ports, or `VITE_*` into GitHub for that job.

## Required for remote Turbo cache

| Name | Kind | Used by | Notes |
|------|------|---------|--------|
| `TURBO_TOKEN` | Secret | Check, Overall, Main, Version | [Vercel / Turborepo remote cache](https://turborepo.dev/docs/core-concepts/remote-caching) token. Jobs still run if unset; cache uploads/downloads are skipped. |
| `TURBO_TEAM` | Variable | Check, Overall, Main, Version | Turbo team / org slug for the same remote cache. Pair with `TURBO_TOKEN`. |

## Provided by GitHub (do not add)

| Name | Kind | Used by | Notes |
|------|------|---------|--------|
| `GITHUB_TOKEN` | Secret | Check, Overall, Main, Version, CodeQL | Automatic. Checkout, coverage upload (`code-quality: write` on Overall), `bun run release ci`, and CodeQL SARIF upload use it. Do not paste a PAT here unless you intentionally override the default. |

## Not used yet (commented in Main)

Leave unset until image publish is enabled:

| Name | Kind |
|------|------|
| `DOCKER_REGISTRY` | Secret |
| `DOCKER_USERNAME` | Secret |
| `DOCKER_PASSWORD` | Secret |

## Local compose vs Actions

App ports and DB URLs for Docker live in [`.env.sample`](../.env.sample). CI `attach-service-ports` fills missing keys from that file; prod compose interpolates the same defaults. No extra Actions env is required for web `:3000`, auth `:3001`, nest `:3002`, ui `:9000`, or Postgres `:5432`.

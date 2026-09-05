#!/usr/bin/env bash
# Idempotent repository bootstrap for Cloud Agents.
# Runs after the repo is checked out. Installs dependencies, generates Prisma
# clients, and prepares local .env files. Must terminate and be safe to re-run.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "==> bun install (deps only; skip lifecycle scripts)"
# --ignore-scripts avoids the root `lefthook install` postinstall (which conflicts
# with the Cloud Agent managed git hooks path) and the per-app `db:generate`
# postinstall (run explicitly below). Mirrors the Docker dev-stack install.
bun install --ignore-scripts

echo "==> Generate Prisma clients"
(cd apps/nestjs && bun run db:generate)
(cd apps/auth && bun run db:generate)

echo "==> Create local .env files from samples (if missing)"
for dir in . apps/nestjs apps/auth apps/web packages/ui; do
    if [ -f "$dir/.env.sample" ] && [ ! -f "$dir/.env" ]; then
        cp "$dir/.env.sample" "$dir/.env"
        echo "    created $dir/.env"
    fi
done

# The local PostgreSQL server has no TLS, so force sslmode=disable for the
# Prisma schema engine (which otherwise attempts SSL against the IP host).
if ! grep -q 'sslmode=disable' apps/nestjs/.env; then
    sed -i 's#\(DATABASE_URL=postgresql://[^[:space:]]*/fivenines\)$#\1?sslmode=disable#' apps/nestjs/.env
fi
if ! grep -q 'sslmode=disable' apps/auth/.env; then
    sed -i 's#\(AUTH_DATABASE_URL=postgresql://[^[:space:]]*/fivenines_auth\)$#\1?sslmode=disable#' apps/auth/.env
fi

echo "==> Generate auth dev signing keys (if missing)"
if [ ! -f apps/auth/dev-keys/private.pem ]; then
    (cd apps/auth && bun run keys:generate)
fi

echo "==> install.sh complete"

#!/usr/bin/env bash
# Per-boot runtime initialization for Cloud Agents.
# Starts PostgreSQL, ensures the dev role/databases exist, and applies Prisma
# migrations + idempotent seeds. Tolerates restarts; returns when ready.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PG_VER=16
CLUSTER=main

echo "==> Ensure PostgreSQL cluster ${PG_VER}/${CLUSTER} exists"
if ! sudo pg_lsclusters -h 2>/dev/null | awk '{print $1"/"$2}' | grep -qx "${PG_VER}/${CLUSTER}"; then
    sudo pg_createcluster "${PG_VER}" "${CLUSTER}"
fi

echo "==> Start PostgreSQL"
sudo pg_ctlcluster "${PG_VER}" "${CLUSTER}" start || true

echo "==> Wait for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
    if sudo -u postgres pg_isready -q; then
        break
    fi
    sleep 1
done
sudo -u postgres pg_isready

echo "==> Ensure role and databases"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='fivenines'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE ROLE fivenines LOGIN PASSWORD 'fivenines' SUPERUSER"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='fivenines'" | grep -q 1 \
    || sudo -u postgres createdb -O fivenines fivenines
# @apps/auth's `db:migrate` runs ensure-db.ts which creates fivenines_auth itself,
# but create it up front so the very first migration has a target.
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='fivenines_auth'" | grep -q 1 \
    || sudo -u postgres createdb -O fivenines fivenines_auth

# The Prisma CLI reads these from the process environment (the `--env-file`
# values are not propagated to the schema engine spawned by bunx).
export DATABASE_URL="postgresql://fivenines:fivenines@127.0.0.1:5432/fivenines?sslmode=disable"
export AUTH_DATABASE_URL="postgresql://fivenines:fivenines@localhost:5432/fivenines_auth?sslmode=disable"

echo "==> Apply @apps/nestjs migrations + seed"
(cd apps/nestjs && bun run db:migrate:deploy && bun run db:seed)

echo "==> Apply @apps/auth migrations + seed"
(cd apps/auth && bun run db:migrate && bun run db:seed)

echo "==> start.sh complete — PostgreSQL ready, databases migrated and seeded"

# AGENTS.md

**@apps/web** — Five Nines player UI (TanStack Start SSR, file-based router).

## Overview

- **Port:** 3001 (`WEB_PORT`)
- **Stack:** Vite + `@tanstack/react-start` + `@tanstack/react-router` file routes
- **Must not** import `@packages/simulation-engine` or run ticks in the browser.
- Nest reads in loaders go through `createServerFn` + `@packages/nestjs-sdk/server` (loaders are isomorphic; keep private I/O in server functions).
- Pin `@tanstack/react-router` to the version `@tanstack/react-start` depends on (currently `1.170.32`). Do not reuse `@packages/shared-tanstack`'s older router pin in this app.

## File routes

Routes live under `src/routes/` (same convention as xpertell product apps):

| File | Route |
|------|--------|
| `src/routes/__root.tsx` | Root document, Query + `FetcherSettingsProvider` |
| `src/routes/index.tsx` | `/` — SSR health check against Nest |

`src/router.tsx` exports `getRouter()` (required by Start). Use `trailingSlash: "never"`. `src/routeTree.gen.ts` is generated on Vite build/dev — do not hand-edit.

## Essential commands

```bash
bun run turbo run dev --filter=@apps/web   # http://localhost:3001 (needs Nest on :3006)
bun run typecheck --filter=@apps/web
bun test apps/web
```

Browser API origin: `VITE_NESTJS_API_URL` (see `.env.sample`). SSR fetch uses `NESTJS_API_URL`.

## Docker

```bash
bun run container up -- --profile web   # postgres + nestjs + web
```

Compose `all` also starts web. Prod-shaped `docker-compose.yml` does not include this app yet.

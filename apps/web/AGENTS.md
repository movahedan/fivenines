# AGENTS.md

**@apps/web** — Five Nines player UI (TanStack Start SSR, file-based router).

## Overview

- **Port:** 3000 (`WEB_PORT`)
- **Stack:** Vite + `@tanstack/react-start` + `@tanstack/react-router` file routes
- **Must not** import `@packages/simulation-engine`. Production routes must not construct `Game` or `tick()` in the browser.
- **`/lab` exception:** `src/lab/` constructs `@packages/fivenines-engine` `Game` on the client (Opening Shift). Nest is the future production caller.
- Nest reads in loaders go through `createServerFn` + `@packages/nestjs-sdk/server` (loaders are isomorphic; keep private I/O in server functions).
- Pin `@tanstack/react-router` to the version `@tanstack/react-start` depends on (currently `1.170.32`). Do not reuse `@packages/shared-tanstack`'s older router pin in this app.

## File routes

Routes live under `src/routes/` (same convention as xpertell product apps):

| File | Route |
|------|--------|
| `src/routes/__root.tsx` | Root document, Query + `FetcherSettingsProvider` + `AuthProvider` (`restoreOnMount={false}`) |
| `src/routes/index.tsx` | `/` — SSR health check against Nest; Play links to `/hub` |
| `src/routes/status.tsx` | `/status` — process-up HTML page |
| `src/routes/hub.tsx` | `/hub` — `PlayButton`, `useAuth().wasLoggedIn` / `loginHref({ redirectUri: "/hub" })`; clock SSE with cookies |
| `src/routes/lab.tsx` | `/lab` — session-gated engine harness (`LabSession`) |

`src/router.tsx` exports `getRouter()` (required by Start). Use `trailingSlash: "never"`. `src/routeTree.gen.ts` is generated on Vite build/dev — do not hand-edit.

## Lab

`src/lab/lab-session.tsx` reads the engine wallet; it does **not** subtract cash. Finance strip: `game.finance` cash, jailed, last-hour maintenance vs power. Buy disabled when `jailed` or `cashCents < SKU_ECONOMY[sku].purchaseCents`. Accept disabled when jailed. Sell/Delete stays enabled if a server exists. Reset constructs a new `Game(openingInitial)` (starting cash, not jailed). Region picker uses `REGION_IDS` / `DEFAULT_REGION` from the engine.

```bash
bun test apps/web/src/routes/lab.test.tsx
```

## Essential commands

```bash
bun run turbo run dev --filter=@apps/web   # http://play.fivenines.com:3000 (hosts file; needs Nest :3002 + auth :3001)
bun run typecheck --filter=@apps/web
bun test apps/web
```

Browser API origin: `VITE_NESTJS_API_URL` (default `http://api.fivenines.com:3002`). SSR fetch uses `NESTJS_API_URL` (same URL). Auth origin: `VITE_AUTH_URL`. Player origin: `VITE_APP_ORIGIN`. Vite `allowedHosts` includes `play.fivenines.com`. Home must not `restore()`.

Health: `GET /` or `GET /status` with `Accept: application/json` returns `{ ok, timestamp }` (process-up). The `/status` page is HTML for humans. Compose HEALTHCHECK probes `/`.

## Docker

```bash
bun run container up -- --profile web   # postgres + nestjs + web
```

Compose `all` also starts web. Prod-shaped `docker-compose.yml` includes this app (`x-fivenines-package: "@apps/web"`).

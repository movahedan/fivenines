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
| `src/routes/__root.tsx` | Root document, Query + `FetcherSettingsProvider` + `AuthProvider` (`restoreOnMount={false}`) |
| `src/routes/index.tsx` | `/` — SSR health check against Nest; Play links to `/hub` |
| `src/routes/hub.tsx` | `/hub` — `PlayButton`, `useAuth().wasLoggedIn` / `loginHref({ redirectUri: "/hub" })`; clock SSE with cookies |

`src/router.tsx` exports `getRouter()` (required by Start). Use `trailingSlash: "never"`. `src/routeTree.gen.ts` is generated on Vite build/dev — do not hand-edit.

## Essential commands

```bash
bun run turbo run dev --filter=@apps/web   # http://play.fivenines.com:3001 (hosts file; needs Nest :3006 + auth :3007)
bun run typecheck --filter=@apps/web
bun test apps/web
```

Browser API origin: `VITE_NESTJS_API_URL` (default `http://api.fivenines.com:3006`). SSR fetch uses `NESTJS_API_URL`. Auth origin: `VITE_AUTH_URL`. Player origin: `VITE_APP_ORIGIN`. Vite `allowedHosts` includes `play.fivenines.com`. Home must not `restore()`.

## Docker

```bash
bun run container up -- --profile web   # postgres + nestjs + web
```

Compose `all` also starts web. Prod-shaped `docker-compose.yml` does not include this app yet.

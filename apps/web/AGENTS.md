# AGENTS.md

**@apps/web** — Five Nines player UI (TanStack Start SPA, file-based router). Production serves `dist/client` with nginx (no Node).

**Code review:** [`.github/instructions/web.instructions.md`](../../.github/instructions/web.instructions.md) (shared with GitHub Copilot).

## Overview

- **Port:** 3000 (`WEB_PORT`)
- **Stack:** Vite + `@tanstack/react-start` (`spa.enabled`) + `@tanstack/react-router` file routes. No runtime Node and no server functions.
- Production routes must not construct `Game` or `tick()` in the browser, except the temporary `/hub` and `/lab` clients below.
- **`/hub` and `/lab` exceptions:** `src/hub/` and `src/lab/` construct `@packages/fivenines-engine` `Game` on the client (Opening Shift). Nest campaign/SSE is the future production caller. Clock SSE on `/hub` is session health (unauthenticated → login), not the sim clock.
- Hub talks to Nest from the **browser** (`VITE_NESTJS_API_URL`). Do not add Start server functions or `@packages/nestjs-sdk/server`.
- Pin `@tanstack/react-router` to the version `@tanstack/react-start` depends on (currently `1.170.32`). Do not reuse `@packages/shared-tanstack`'s older router pin in this app.

## File routes

Routes live under `src/routes/` (same convention as xpertell product apps):

| File | Route |
|------|--------|
| `src/routes/__root.tsx` | Root document, Query + `FetcherSettingsProvider` + `AuthProvider` (`restoreOnMount={false}`) |
| `src/routes/index.tsx` | `/` — stub home (Play → `/hub`, Lab) |
| `src/routes/hub.tsx` | `/hub` — session gate + clock-SSE health; renders `HubSession` (ops floor) |
| `src/routes/lab.tsx` | `/lab` — session-gated verbose engine harness (`LabSession`) |

`src/router.tsx` exports `getRouter()` (required by Start). Use `trailingSlash: "never"`. `src/routeTree.gen.ts` is generated on Vite build/dev — do not hand-edit. There is no React `/status` route: process-up JSON is Vite middleware (dev) or nginx (`location = /status`). SPA fallback is `dist/client/_shell.html`.

## Hub

`src/hub/` is the player ops console: HUD + incoming / active+fleet / market + event log, composed from `@packages/ui/molecules`. Fleet/market `ServerCard` `dotClassName` comes from `SKU_DOT_CLASS` in `hub-map.ts` (token utilities, not hex). SKU CPU is `formatters.cores(computeUnitsPerHour)` (e.g. `1000 cores`); offer CPU is `formatters.coresCompact(estimatedRequestsPerHour)` (`2000c`) — same kernel integers, word only, not a 4/8/16 SKU table. HUD tick/clock and SLA percents use `@packages/shared/formatters` (`TICK 0000`, `DAY 01 · HR 00:00`, `99.00%`). `use-hub-game.ts` owns `Game(openingInitial)`, interval `tick()` (skipped while paused **or** when `hourIndex >= OPENING_SHIFT_HOURS`), and `dispatch`. HUD time is `game.hourIndex`, not SSE `at`. Account chrome is `useAuth()` in web (sign-out slot). Sign out sends the browser to `@apps/auth` `logoutHref({ redirectUri: "/" })`; auth 302s to that allowlisted URI after clearing cookies. Visiting `/hub` without a session still uses `loginHref({ redirectUri: "/hub" })`. Molecules stay engine-agnostic.

Decline dispatches `declineProject` (offer leaves Incoming; allowed while jailed). Accept stays disabled when jailed. Active cards show current-hour vs rolling 168h vs target vs recovery ETA (`slaRecoveryHours`); status/tone still use window vs `targetPpm`. Sparkline bars color vs `targetPpm/1e6` (empty → warming). HUD: **CASH**, **Receivable today** (`accountsReceivableCents`), **OPEX / hour**. Active green digit is **WTD revenue** (`periodPaygCents`). Event log: Hub command lines plus `game.events` after each tick (SLA, PAYG settle, weekly credit, saturation, cash low). Root layout is `h-screen overflow-hidden`; the event log is a bounded `h-40` scroller (`overflow: scroll`) so new lines stay reachable. At hour 336 the tick loop stops and a result overlay uses `openingShiftOutcome` (win: positive cash, ≥2 contracts meeting window target, no 100% credit, not jailed). **Reset** builds `Game(openingInitial)` and clears the log. Buy gates match lab (`jailed` or cash below `SKU_ECONOMY`).

```bash
bun test apps/web/src/routes/hub.test.tsx
```

## Lab

`src/lab/lab-session.tsx` reads the engine wallet; it does **not** subtract cash. Finance strip: `game.finance` cash, **accounts receivable**, jailed, last-hour maintenance vs power. Buy disabled when `jailed` or `cashCents < SKU_ECONOMY[sku].purchaseCents`. Accept disabled when jailed. Sell/Delete stays enabled if a server exists. Reset constructs a new `Game(openingInitial)` (starting cash, not jailed). Region picker uses `REGION_IDS` / `DEFAULT_REGION` from the engine.

Offered project rows show region, baseline, category, spike/campaign flags, PAYG per thousand, recurring, SLA target, and the 25/50/100 credit bands before Accept. Served project rows show this-hour and window `availabilityPpm` from `project.metrics` (`—` when `null`). Offered and declined rows show no live this-hour/window SLA digits. No sparkline.

Served rows also show this-period PAYG (`periodPaygCents`), hours served this week, last settlement (or `—`), and a compact list of ≤8 closes from `project.settlements`. Offered rows do not show this-period PAYG or settlement history. Lab does not run week-close or receivable settle itself.

```bash
bun test apps/web/src/routes/lab.test.tsx
```

## Essential commands

```bash
bun run turbo run dev --filter=@apps/web   # http://play.fivenines.com:3000 (hosts file; hub/lab need Nest :3002 + auth :3001)
bun run turbo run build --filter=@apps/web
bun run --filter=@apps/web preview:static  # serve dist/client locally (not nginx /status JSON)
bun run typecheck --filter=@apps/web
bun test apps/web
```

Browser API origin: `VITE_NESTJS_API_URL` (default `http://api.fivenines.com:3002`). Auth origin: `VITE_AUTH_URL`. Player origin: `VITE_APP_ORIGIN`. Vite `allowedHosts` includes `play.fivenines.com`. Home must not `restore()`.

Health: `GET /status` returns JSON `{ "ok": true }` (Vite middleware also includes `timestamp`). Compose HEALTHCHECK probes `/status`. `/` is HTML.

## Docker

```bash
bun run container up -- --profile web   # postgres + nestjs + Vite web (dev)
```

Compose `all` also starts web. Prod-shaped `docker-compose.yml` serves nginx + `dist/client` (`listen 3000`, SPA `_shell.html`); that service does not `depends_on` nestjs. Do not copy `dist/server` into the image.

# AGENTS.md

**@apps/web** — Five Nines player UI (TanStack Start SPA, file-based router). Production serves `dist/client` with nginx (no Node).

**Code review:** [`.github/instructions/web.instructions.md`](../../.github/instructions/web.instructions.md) (shared with GitHub Copilot).

## Overview

- **Port:** 3000 (`WEB_PORT`)
- **Stack:** Vite + `@tanstack/react-start` (`spa.enabled`) + `@tanstack/react-router` file routes. No runtime Node and no server functions. SPA shell is `dist/client/_shell.html` (hub/lab fallback). Marketing HTML is prerendered (`index.html`, `about/index.html`, …). Login `redirect_uri` uses the play page origin, never the auth origin (`:3001`).
- Production routes must not construct `Game` or `tick()` in the browser, except the temporary `/hub` and `/lab` clients below.
- Marketing page copy lives in the matching `src/routes/*.tsx` file. Shared chrome (`SiteChrome`, `SitePage`) is `src/components/`. Do not import `@packages/auth` from those files. `Play` is `/hub`.
- `@packages/analytics`: `initAnalytics` + Silktide in `src/routes/-bootstrap-web-client.ts` (after first paint). GTM only when production, `VITE_GTM_CONTAINER_ID` set, and analytics consent. PWA via `vite-plugin-pwa` `generateSW` (`start_url: /`, Play shortcut `/hub`). No Firebase / FCM.
- **`/hub` and `/lab` exceptions:** `src/hub/` and `src/lab/` construct `@packages/fivenines-engine` `Game` on the client (Opening Shift). Nest campaign/SSE is the future production caller. Clock SSE on `/hub` is session health (unauthenticated → login), not the sim clock.
- Hub talks to Nest from the **browser** (`VITE_NESTJS_API_URL`). Do not add Start server functions or `@packages/nestjs-sdk/server`.
- Pin `@tanstack/react-router` to the version `@tanstack/react-start` depends on (currently `1.170.32`). Do not reuse `@packages/shared-tanstack`'s older router pin in this app.

## File routes

Routes live under `src/routes/` (same convention as xpertell product apps):

| File | Route |
|------|--------|
| `src/routes/__root.tsx` | Root document shell (`html` / `head` / `#root` / `Outlet`). No `AuthProvider`, fetcher, or `QueryClient`. Silktide + Consent Mode script tags. |
| `src/routes/index.tsx` | `/` — marketing home in this file (Play → `/hub`). Shared chrome from `src/components/`. Must not `restore()` or import `@packages/auth`. |
| `src/routes/about.tsx` | `/about` |
| `src/routes/privacy.tsx` | `/privacy` |
| `src/routes/terms.tsx` | `/terms` |
| `src/routes/cookie-policy.tsx` | `/cookie-policy` (`openCookiePreferences`) |
| `src/routes/contact.tsx` | `/contact` (mailto + GitHub + wiki) |
| `src/routes/hub.tsx` | `/hub` — `PlayProviders` + session gate + clock-SSE health; renders `HubSession` (ops floor) |
| `src/routes/lab.tsx` | `/lab` — `PlayProviders` + session-gated verbose engine harness (`LabSession`) |

`src/play/play-providers.tsx` mounts `QueryClientProvider`, `AuthProvider` (`restoreOnMount={false}`, `playerAuthSession`), and `FetcherSettingsProvider` (Nest `baseURL` + `createAuthFetcherBindings`). Hub/lab tests wrap `AuthProvider` only; they do not need the Nest fetcher.

`src/router.tsx` exports `getRouter()` (required by Start). Use `trailingSlash: "never"`. `src/routeTree.gen.ts` is generated on Vite build/dev — do not hand-edit. Hub/lab SPA fallback is `dist/client/_shell.html`. Marketing is `WEB_PRERENDER=1 bun scripts/prerender-web.ts` after `vite build` (`export:check` asserts `<title>` + `og:image`). There is no JSON `/status` on web.

## Hub

`src/hub/` is the player ops console: HUD + incoming / active+fleet / market + event log, composed from `@packages/ui/molecules`. Fleet/market `ServerCard` `dotClassName` comes from `SKU_DOT_CLASS` in `hub-map.ts` (token utilities, not hex). SKU CPU is `formatters.cores(computeUnitsPerHour)` (e.g. `1000 cores`); offer CPU is `formatters.coresCompact(estimatedRequestsPerHour)` (`2000c`) — same kernel integers, word only, not a 4/8/16 SKU table. HUD tick/clock and SLA percents use `@packages/shared/formatters` (`TICK 0000`, `DAY 01 · HR 00:00`, `99.00%`). `use-hub-game.ts` owns `Game(openingInitial)`, interval `tick()` (skipped while paused **or** when `hourIndex >= OPENING_SHIFT_HOURS`), and `dispatch`. HUD time is `game.hourIndex`, not SSE `at`. Account chrome is `useAuth()` in web (sign-out slot). Sign out sends the browser to `@apps/auth` `logoutHref({ redirectUri: "/" })`; auth 302s to that allowlisted URI after clearing cookies. Visiting `/hub` without a session still uses `loginHref({ redirectUri: "/hub" })`. Molecules stay engine-agnostic: the offer and active cards gained optional `serverOptions` / `selectedServerId` / `onSelectServer` / `onRoute` / `onUnassign` props that take plain ids, labels, and callbacks.

Decline dispatches `declineProject` (offer leaves Incoming; allowed while jailed). Accept needs a target box as well as a clean record: every offer card carries a whole-fleet picker (cross-region included), Accept is disabled while jailed **or** while the fleet is empty, and the card shows a `No servers` hint until the player buys or leases one. Served cards get **MOVE** and **PARK**; parked cards get **ASSIGN** and render in the Active grid after the served rows, with a `Parked (n)` counter in the Active panel header’s trailing slot. `No served projects` shows only when both lists are empty. Active cards show current-hour vs rolling 168h vs target vs recovery ETA (`slaRecoveryHours`); status/tone still use window vs `targetPpm`. The card’s server line is the routed box and its tier (`server-1 · Bronze`), or `PARKED`. Sparkline bars color vs `targetPpm/1e6` (empty → warming). HUD: **CASH**, **Receivable today** (`accountsReceivableCents`), **OPEX / hour** (includes lease rent). Active green digit is **WTD revenue** (`periodPaygCents`). Event log: Hub command lines (which name the target server) plus `game.events` after each tick (SLA, PAYG settle, weekly credit, saturation, cash low); `commandLogTone` in `hub-map.ts` is an exhaustive `Record<EngineCommand["type"], EventLogTone>` (`leaseServer` success, `releaseServer` warn). Root layout is `h-screen overflow-hidden`; the event log is a bounded `h-40` scroller (`overflow: scroll`) so new lines stay reachable. At hour 336 the tick loop stops and a result overlay uses `openingShiftOutcome` (win: positive cash, ≥2 contracts meeting window target, no 100% credit, not jailed). **Reset** builds `Game(openingInitial)` and clears the log.

Market `ServerCard`s offer **BUY** (`buyServer`, disabled when jailed or cash below `SKU_ECONOMY[sku].purchaseCents`) and **LEASE** (`leaseServer`, disabled only when jailed — acquire is free). COST is purchase; OPEX is owned idle maint+power; RENT is catalog `leaseHourlyCents`. Fleet cards show `idLabel` with tenure (`server-1 · owned` / `leased`). Owned boxes get **SELL** (`sellServer`); leased boxes get **RELEASE** (`releaseServer`). Fleet OPEX on a leased box is idle+rent (`skuFleetOpexLabel`).

```bash
bun test apps/web/src/routes/hub.test.tsx
```

## Lab

`src/lab/lab-session.tsx` reads the engine wallet; it does **not** subtract cash. Finance strip: `game.finance` cash, **accounts receivable**, jailed, last-hour maintenance / power / **lease** / **total opex**. Buy disabled when `jailed` or `cashCents < SKU_ECONOMY[sku].purchaseCents`. Lease disabled only when jailed. Accept disabled when jailed **or** while the fleet is empty. Owned assets use Delete → `sellServer`; leased assets use Release → `releaseServer`. Reset constructs a new `Game(openingInitial)` (starting cash, not jailed). Region picker uses `REGION_IDS` / `DEFAULT_REGION` from the engine; a server `<select>` feeds Accept and the Move / Park / Assign controls.

Offered project rows show region, baseline, category, spike/campaign flags, PAYG per thousand, recurring, SLA target, and the 25/50/100 credit bands before Accept. Served and offline project rows show this-hour and window `availabilityPpm` from `project.metrics` (`—` when `null`) plus the routed server id (`routed server-1`, or `routed parked`). Offered and declined rows show no live this-hour/window SLA digits. No sparkline.

Those rows also show this-period PAYG (`periodPaygCents`), hours served this week, last settlement (or `—`), and a compact list of ≤8 closes from `project.settlements`. Offered rows do not show this-period PAYG or settlement history. Lab does not run week-close or receivable settle itself.

```bash
bun test apps/web/src/routes/lab.test.tsx
```

## Essential commands

```bash
bun run turbo run dev --filter=@apps/web   # http://play.fivenines.com:3000 (hosts file; hub/lab need Nest :3002 + auth :3001)
bun run turbo run build --filter=@apps/web
bun run --filter=@apps/web export:check
bun run --filter=@apps/web preview:static  # bunx serve dist/client -s
bun run typecheck --filter=@apps/web
bun test apps/web packages/analytics
```

Browser API origin: `VITE_NESTJS_API_URL` (default `http://api.fivenines.com:3002`). Auth origin: `VITE_AUTH_URL`. Player origin: `VITE_APP_ORIGIN` (absolute OG URLs). Optional `VITE_GTM_CONTAINER_ID` (no `GTM-` prefix). Vite `allowedHosts` includes `play.fivenines.com`. Home must not `restore()`.

Health: prod nginx and Check probe `GET /` for the string `Five Nines` in the built shell HTML. Dev Vite is the same (`<title>` / home copy). Auth, Nest, and Storybook still use JSON `GET /status`.

## Docker

```bash
bun run container up -- --profile web   # postgres + nestjs + Vite web (dev)
```

Compose `all` also starts web. Prod-shaped `docker-compose.yml` serves nginx + `dist/client` (`listen 3000`); that service does not `depends_on` nestjs. Do not copy `dist/server` into the image. `VITE_*` is bake-time (`.env.sample` in the image build), not compose runtime.

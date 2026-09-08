---
applyTo: "apps/web/**"
---

Shared review rubric (GitHub Copilot + Cursor). Implementation truth: [`apps/web/AGENTS.md`](../../apps/web/AGENTS.md).

When performing a code review on `@apps/web`:

- `/hub` and `/lab` are the only allowed client `Game` constructors. Flag new routes that tick the engine in the browser.
- Hub HUD clock is `game.hourIndex`, not Nest clock SSE `at`. SSE is session health.
- Map engine fields in hub/lab. Do not push hex colors or `Game` types into `@packages/ui`.
- Do not hand-edit `src/routeTree.gen.ts`.
- Pin `@tanstack/react-router` to the version `@tanstack/router-plugin` depends on. Do not pull `@packages/shared-tanstack`’s older router pin into this app. Do not reintroduce `@tanstack/react-start` or `createServerFn`.
- Sign-out / login must keep `.fivenines.com` cookie + allowlisted `redirect_uri` behavior. Do not reintroduce a Vite `/auth` proxy or `/callback` code exchange.

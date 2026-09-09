# AGENTS.md

**@packages/analytics** — Browser consent + Google Tag Manager. Ported from xpertell **without** Firebase / FCM.

**Code review:** [`.github/instructions/web.instructions.md`](../../.github/instructions/web.instructions.md) (web owns Silktide static files and `initAnalytics` wiring).

## Role

- `initAnalytics(buildAnalyticsConfig({ … }))` once per app with `import.meta.env` (`VITE_GTM_CONTAINER_ID` only).
- `initConsentManager()` after Silktide’s script loads. Analytics `onAccept` calls `setupTagManager()`.
- Empty GTM id or `isDevelopment` → no GTM inject. Production + consent + id required.

Do **not** add `@firebase/*`, FCM, or `firebase-messaging-sw`. Static Silktide CSS/JS live in `apps/web/public/silktide/`. Theme overrides are `fivenines-consent.css` (ops green on `#050912`).

## Commands

```bash
bun test packages/analytics
bun run turbo run typecheck --filter=@packages/analytics
```

## Exports

| Import | Contents |
|--------|----------|
| `@packages/analytics` | `initAnalytics`, `initConsentManager`, `openCookiePreferences`, `buildAnalyticsConfig`, `ANALYTICS_ENV_VAR_NAMES` |

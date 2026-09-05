# AGENTS.md

**@packages/auth** — browser auth session + React provider for `@apps/auth`, plus shared scopes / JWT claim types.

## Exports

| Import | Contents |
|--------|----------|
| `@packages/auth` | `AuthSession`, `authSession`, `restore()`, `createAuthFetcherBindings`, login/refresh helpers, contract re-exports |
| `@packages/auth/contract` | Scopes / JWT claim types only (server-safe; prefer this from Nest / auth service) |
| `@packages/auth/react` | `AuthProvider` (`restoreOnMount` default true; Play sets false), `useAuth` |

**Not included:** `FetcherSettingsProvider` — compose that in the app with `@packages/http/react`.

## Contract (`src/contract/`)

- `SCOPES` / `Scope` — `feature-flags:admin` | `write` | `read`
- `ROLE_SCOPES` — scopes per tenant role (`owner`, `admin`, `member`)
- `hasScope(granted, required)` — hierarchy: `admin` → `write` → `read`

## Session model

- **Access JWT** — HttpOnly cookie (`auth_access`, `Domain=.fivenines.test` locally) for Play → Nest. Bearer still used for M2M and tests.
- **`was_logged_in`** — public cookie; hub uses it only to skip bouncing to login.
- **Session / refresh** — HttpOnly cookies; `POST /api/refresh` with `credentials: "include"` rotates them. JSON may be `{ ok: true }` with no tokens.
- Play home sets `AuthProvider` `restoreOnMount={false}`. Guarded `/hub` owns login/refresh.

Play navigates to `/hub`. Hub sends the browser to `@apps/auth` `/login` when the hint cookie is missing. Auth 302s back to `/hub`. Do not proxy `/auth` through Vite.

## App wiring

```tsx
import { authSession, createAuthFetcherBindings } from "@packages/auth";
import { AuthProvider, useAuth } from "@packages/auth/react";
import { FetcherSettingsProvider } from "@packages/http/react";

const authFetch = createAuthFetcherBindings(authSession);

function Shell() {
  const { isReady, isAuthenticated, getLoginHref } = useAuth();
  if (!isReady) return null;
  return isAuthenticated ? <App /> : <a href={getLoginHref("/hub")}>Sign in</a>;
}

<AuthProvider>
  <FetcherSettingsProvider
    initialSettings={{
      config: {
        baseRequestConfig: { baseURL: nestBaseUrl },
        ...authFetch,
      },
    }}
  >
    <Shell />
  </FetcherSettingsProvider>
</AuthProvider>
```

## Commands

```bash
bun run typecheck
bun test
```

## Related

- [`@apps/auth`](../../apps/auth/AGENTS.md) — JWT / refresh / login service
- [`@packages/http`](../http/AGENTS.md) — fetcher runtimes

# AGENTS.md

**@packages/auth** — browser auth session + React provider for `@apps/auth`, plus shared scopes / JWT claim types.

**Code review:** [`.github/instructions/auth-nest.instructions.md`](../../.github/instructions/auth-nest.instructions.md) (shared with GitHub Copilot).

## Exports

| Import | Contents |
|--------|----------|
| `@packages/auth` | `AuthSession`, `authSession`, `restore()`, `createAuthFetcherBindings`, login/refresh helpers, contract re-exports |
| `@packages/auth/contract` | Scopes / JWT claim types only (server-safe; prefer this from Nest / auth service) |
| `@packages/auth/react` | `AuthProvider` (`authOrigin` / `appOrigin` from env + `restoreOnMount`), `useAuth` (`loginHref`, `logoutHref`, `wasLoggedIn`) |

**Not included:** `FetcherSettingsProvider` — compose that in the app with `@packages/http/react`.

## Contract (`src/contract/`)

- `SCOPES` / `Scope` — `feature-flags:admin` | `write` | `read`
- `ROLE_SCOPES` — scopes per tenant role (`owner`, `admin`, `member`)
- `hasScope(granted, required)` — hierarchy: `admin` → `write` → `read`

## Session model

- **Access JWT** — HttpOnly cookie (`auth_access`, `Domain=.fivenines.com` locally) for Play → Nest. Bearer still used for M2M and tests.
- **`wasLoggedIn`** — public cookie hint on `useAuth()`; not proof of a valid session.
- **Session / refresh** — HttpOnly cookies; `POST /api/refresh` with `credentials: "include"` rotates them. JSON may be `{ ok: true }` with no tokens.
- `@apps/web` home and `__root` do **not** mount `AuthProvider`. `/hub` and `/lab` own `AuthProvider` (`restoreOnMount={false}`) plus login/refresh.

Play navigates to `/hub`. Hub sends the browser to `@apps/auth` `/login` when the hint cookie is missing (`loginHref({ redirectUri: "/hub" })`). Sign out uses `logoutHref({ redirectUri: "/" })` so auth `/logout` 302s to the allowlisted `redirect_uri`. Do not proxy `/auth` through Vite.

## App wiring

Compose in `@apps/web` **play routes only** (`src/play/play-providers.tsx` on `/hub` and `/lab`), not on marketing/`__root`:

```tsx
import { authSession, createAuthFetcherBindings } from "@packages/auth";
import { AuthProvider, useAuth } from "@packages/auth/react";
import { FetcherSettingsProvider } from "@packages/http/react";

const authFetch = createAuthFetcherBindings(authSession);

function Shell() {
  const { wasLoggedIn, loginHref } = useAuth();
  if (!wasLoggedIn) {
    window.location.assign(loginHref({ redirectUri: "/hub" }));
    return null;
  }
  return <App />;
}

<AuthProvider
  authOrigin={import.meta.env.VITE_AUTH_URL}
  appOrigin={import.meta.env.VITE_APP_ORIGIN}
>
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

# @apps/auth

Authentication service for the fivenines feature-flags platform.

## Product flows

| Actor | Method | Scopes (typical) | Calls |
|-------|--------|------------------|-------|
| Tenant admin/owner | Human login | `admin`, `write`, `read` | Nest management API |
| Tenant member | Human login | `read` | Read paths |
| Nest / services | M2M `POST /api/token` | `read` (seed client) | Flag resolution |

Human JWT `aud` = `fivenines-api` (env `AUTH_AUDIENCE`). Machine JWT `aud` = `fivenines-eval` by default (`AUTH_AUDIENCE_EVAL`).

## JWT claims (human)

| Claim | Meaning |
|-------|---------|
| `sub` | User id |
| `tid` | Active tenant id |
| `scopes` | From `ROLE_SCOPES` for membership role |
| `iss` / `aud` | `AUTH_ISSUER` / `AUTH_AUDIENCE` |

Machine tokens omit `tid`; `sub` = `clientId`.

## HTTP API

### Refresh (browser)

```bash
curl -sf -X POST http://localhost:3001/api/refresh \
  -H "Cookie: auth_session=...; auth_refresh=..."
```

Returns `{ ok: true }` and Set-Cookie for rotated refresh + access JWT (`auth_access`) + `was_logged_in`.

### M2M token (RFC 7523 client assertion)

```bash
# client_assertion = JWT signed by machine private key; iss=sub=client_id
curl -sf -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    "client_assertion": "<jwt>",
    "scope": "feature-flags:read"
  }'
```

Seed client: `nestjs-control-plane` with `feature-flags:read`.

### tRPC (`/api`)

- `auth.login`, `auth.register`, `auth.requestOtp`, `auth.verifyOtp`, `auth.logout`, `auth.me`, `auth.switchTenant`

## Registration and OTP

**Password register:** `GET /register` or `auth.register` — creates a user, personal tenant (owner role), and session.

**Email OTP (dev):** `GET /otp` → `auth.requestOtp` → enter code on `/otp/verify`. With `AUTH_OTP_LOG=true`, the 6-digit code is printed to the auth server console (no SMTP yet). New emails auto-register when `AUTH_ALLOW_REGISTRATION=true`.

Env (see `.env.sample`): `AUTH_ALLOW_REGISTRATION`, `AUTH_ALLOW_OTP`, `AUTH_OTP_LOG`, `AUTH_OTP_TTL_MINUTES`. Disabled by default when `NODE_ENV=production`.

## Browser flow

1. `GET /login` — CSRF cookie + form (or `/register`, `/otp`)
2. `POST /login` — Set-Cookie session, refresh, access JWT, `was_logged_in`; **302** to the consumer’s allowlisted `redirect_uri` (or relative `next`)
3. Browser calls Nest with `credentials: "include"` (cookie). `POST /api/refresh` with cookies rotates the access JWT.
4. `GET /logout` — revokes session, clears Domain cookies

## Nest verification

Set on `@apps/nestjs`:

- `AUTH_JWKS_URL=http://auth.fivenines.com:3001/.well-known/jwks.json`
- `AUTH_ISSUER=http://auth.fivenines.com:3001`
- `AUTH_AUDIENCE=fivenines-api`
- `AUTH_ALLOW_HEADER_TENANT=true` (development only) to allow `x-tenant-id` without JWT

Management routes use `JwtAuthGuard` + `@RequireScopes()` from `@packages/auth/contract`.

## Seed

```bash
bun run db:seed
```

Default admin: `AUTH_SEED_ADMIN_EMAIL` / `AUTH_SEED_ADMIN_PASSWORD` (see `.env.sample`).

Demo tenant id after seed: `00000000-0000-4000-8000-000000000001` (slug `demo`) — shared with `@apps/nestjs` seed.

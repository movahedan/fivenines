---
applyTo:
  - "apps/auth/**"
  - "apps/nestjs/**"
  - "packages/auth/**"
  - "packages/http/**"
---

Shared review rubric (GitHub Copilot + Cursor). Implementation truth: nested `AGENTS.md` in auth / nest / http packages.

When performing a code review on auth, Nest, or HTTP:

- Cookies: HttpOnly access on `Domain=.fivenines.com`. Do not log tokens or put secrets in client bundles.
- Nest `JwtAuthGuard` accepts cookie or Bearer. Do not weaken JWT verification or skip allowlisted redirects.
- Flag missing env throws, defaulted secrets, and SSR fetchers that leak server URLs to the browser.
- OpenAPI / Orval: change Nest contract in Nest, regenerate the SDK; do not hand-patch `packages/nestjs-sdk/src/gen/**`.

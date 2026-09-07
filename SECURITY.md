# Security Policy

## Supported versions

This repo is pre-1.0. Security fixes land on `main` and ship in the next release from that branch.

| Version | Supported |
| --- | --- |
| Latest release on `main` (currently 0.2.x) | Yes |
| Older 0.x tags | No |
| Forks and unpublished local checkouts | No |

There is no long-term support train. If you are not on current `main` / the latest GitHub release, upgrade first and re-test before reporting.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/movahedan/fivenines/security/advisories/new). Do not open a public issue, discussion, or pull request for an unfixed vulnerability.

In the report, include:

- Affected commit SHA or release tag
- Impact (auth bypass, secret leak, RCE, injection, and so on)
- Steps to reproduce, or a proof of concept that does **not** include live credentials
- Any workaround you already use

**In scope:** `@apps/auth`, `@apps/nestjs`, `@apps/web`, shared packages, Docker/compose, GitHub Actions, and secret handling.

**Out of scope:** game-balance / simulation bugs, missing features, and dependency CVEs that do not affect a path this repo actually executes. For those, use a normal issue or Dependabot.

## What to expect

This is a small project. You should get an initial response within **7 days**. If we confirm the issue, we will credit you in the advisory (unless you ask otherwise) and publish a fix on `main` before making the report public.

If we decline, we will say why (duplicate, not exploitable here, or out of scope).

Do not disclose the issue publicly until a fix is released, or we have agreed that disclosure is appropriate.

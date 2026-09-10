# Copilot + Cursor — review and coding-agent rubric

Shared with GitHub Copilot (code review **and** coding agent) and Cursor. Implementation maps stay in nested `AGENTS.md`; do not copy formulas here.

## Before you commit

Lefthook runs `bun run overall -- --quiet` on **pre-push**, not on every commit. GitHub Copilot’s commits go through GitHub and **do not run Lefthook**. GitHub Actions **Overall** is the same gate on PRs (`bun install` + `bun run overall`; no `--frozen-lockfile`).

Before `git commit` or `git push`:

1. Run `bun run overall` (or `bun run overall -- --quiet`).
2. Wait for a zero exit. If it fails, fix the failure; do not commit red.
3. Never `git commit --no-verify`, `git push --no-verify`, or `--no-gpg-sign` to skip gates.

When performing a code review, flag Copilot/bot commits that skipped this gate.

## When performing a code review

When performing a code review, prefer **bugs, security, and contract lies** over style. Biome and TypeScript already enforce formatting, `noExplicitAny`, and unused locals. Do not nag about import order, kebab-case filenames, or missing JSDoc.

When performing a code review, treat `@packages/fivenines-engine` as the authority for demand, capacity, wallet, jail, SLA ppm, PAYG, and week close. Flag UI or Nest code that invents those numbers or ticks a second clock. `/hub` and `/lab` may construct `Game` in the browser today; other production routes must not.

When performing a code review, flag `@packages/ui` importing engine types or `Game`. Molecules take display props and callbacks only.

When performing a code review, flag committed `.env`, credentials, API keys, or secrets with assumed defaults. Required env must be read at the use site and throw if missing.

When performing a code review, flag ReDoS: nested quantifiers, overlapping `.*`, `new RegExp(userInput)` without caps, or `Promise.race` around sync `.test` as a fake timeout.

When performing a code review, ignore generated files (`**/routeTree.gen.ts`, `packages/nestjs-sdk/src/gen/**`, Prisma clients). Do not suggest hand-edits there.

When performing a code review, do not demand a 336-hour tick loop in tests. Use helpers like `openingShiftOutcome` instead.

When performing a code review, keep comments short, severity-tagged in Copilot’s usual High/Medium/Low, and include a suggested change when the fix is local.

Path-specific review notes: `.github/instructions/*.instructions.md` (`applyTo`). Cursor reaches the same files via root `AGENTS.md` and `.cursor/rules/code-review.mdc`.

The isolated `apps/figma-design/src/**` is a preserved generated visual reference, not a production route. Its fixture numbers, mock clock and inactive components are intentionally retained and documented in `apps/figma-design/README.md`; do not request a production rewrite of the archive. Review its wrapper, provenance and isolation normally. Production apps/packages must not import this reference or copy its mock mechanics as authoritative behavior.

---
applyTo: "packages/fivenines-engine/**"
---

Shared review rubric (GitHub Copilot + Cursor). Implementation truth: [`packages/fivenines-engine/AGENTS.md`](../../packages/fivenines-engine/AGENTS.md).

When performing a code review on the simulation kernel:

- Tick is one simulated hour. `dispatch` must not advance `hourIndex`, charge opex, accrue PAYG, settle receivable, close the week, or rewrite SLA ring slots.
- Integers at the demand boundary. Do not introduce floats for cash, ppm, or request counts.
- Jail is sticky; do not “fix” it by auto-clearing. Decline may remain allowed while jailed; buy/accept must not.
- Physics conservation: handled + unroutable + capacity drops should still explain emitted load. Do not silently change the 1400 Bronze overload proofs unless the PR’s job is a catalog retune with tests.
- Prefer catalog policy files (`src/catalog/*-policy.ts`) over hardcoded magic in tick paths.
- Formulas in this package’s `AGENTS.md` win over comments in the PR.

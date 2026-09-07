---
name: Opening settlement leftover
overview: "AR daily PAYG settle, tiered SLA credits, lab offer preview. Start cash/maint/category rates already on main. No reputation graph."
todos:
  - id: ar
    content: "PAYG to accountsReceivable; cash settle every 24h"
    status: in_progress
  - id: ar-verify
    content: "bun test packages/fivenines-engine + lab PAYG cash assertions"
    status: pending
  - id: tiers
    content: "Tiered SLA credit 25/50/100 from period ppm vs target"
    status: pending
  - id: lab-preview
    content: "Lab finance AR row; offered rows show region/baseline/pattern/PAYG/SLA/penalty"
    status: pending
  - id: docs-pr
    content: "documentation-sync + git-pr-workflow"
    status: pending
isProject: true
---

# Opening settlement leftover

Already on `main` from the balance PR: start **25_000**, Bronze **18_000**, rising absolute maintenance, per-category PAYG/recurring.

**This branch (new from main):**

| Leftover | Do |
|----------|----|
| PAYG not into cash hourly | `accountsReceivableCents`; settle when `hourIndex % 24 === 0` |
| Tiered SLA credit | mild 25% / severe 50% / catastrophe 100% of period revenue |
| Opening terms not identical | keep category cards; per-project `targetPpm` on a few Opening ids |
| Lab Accept preview | offered rows: region, baseline, category, spike/campaign, PAYG, recurring, target, penalty bands |
| Reputation / contract cancel | **out** — no new project status, no reputation noun |

Settle order after `hourIndex += 1`: daily AR → cash, then week close (recurring − credit). Credit still claws cash (including already-settled PAYG). Jail still sticky from cash only (opex can jail before PAYG lands).

---

## Phase 1 — Receivable

**Surfaces:** `game.ts`, `game.finance.ts`, `game.commercial.ts`, PAYG/finance tests, lab cash assertions.

### Verification

```bash
bun test packages/fivenines-engine
bun test apps/web/src/routes/lab.test.tsx
```

## Phase 2 — Credit bands

**Surfaces:** `commercial-policy.ts` `slaCreditPpm`, `project.closeBillingPeriod`, `billing.close.test.ts`

Bands (period ppm, after miss of `targetPpm`): `>= 950_000` → 250_000 credit ppm; `>= 800_000` → 500_000; else 1_000_000. `null` or `>= target` → 0. `CommercialTerms.creditPpm` unused by close (kept on the card for now).

## Phase 3 — Lab preview

**Surfaces:** `lab-session.tsx`, `lab.test.tsx`, `fixtures.ts` target overrides.

### Documentation before PR

- `packages/fivenines-engine/AGENTS.md`
- `apps/web/AGENTS.md`

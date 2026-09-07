---
name: Engine economy balance
overview: "Scenario harness first, then catalog/PAYG unit retune. No AR, cancel, or lab accept preview."
todos:
  - id: phase-1-harness
    content: "Phase 1: economy.balance.test.ts target scenarios (may be red until phase 2)"
    status: completed
  - id: phase-1-verify
    content: "Phase 1: bun test packages/fivenines-engine/src/economy.balance.test.ts (expect fail)"
    status: completed
  - id: phase-2-policy
    content: "Phase 2: payg per thousand, start cash, maint curve, creditPpm, opening cards"
    status: completed
  - id: phase-2-verify
    content: "Phase 2 gate: bun test packages/fivenines-engine && web lab.test && typecheck"
    status: pending
  - id: phase-2-docs
    content: "Phase 2: documentation-sync engine + web AGENTS"
    status: completed
  - id: phase-2-pr
    content: "Phase 2: git-pr-workflow after green (two commits on one PR)"
    status: pending
isProject: true
---

# Engine economy balance

## Target architecture

Two local commits, one PR after green. Do not push red tests (pre-push runs `bun overall`).

**Naming / invariants:**

| Scenario | Pass when |
|----------|-----------|
| Bronze + one low-risk contract | Modest profit (cash up, not a windfall) |
| Bronze payback | Hours to recoup purchase ≥ 72 |
| Accept-all + one Bronze | Jail or deep cash hole within a week |
| Accept-all, empty fleet | Week close does not profit vs start |
| Overprovision Gold vs Bronze on a small load | Gold nets worse |
| Cautious (one Bronze, one small local project) | Survives 168h, not jailed, cash > 0 |
| Greedy 24h | Cash < 2× start |

**Out of this PR:** accounts receivable, reputation/cancel, `/lab` accept preview, Nest invoices.

---

## Phase 1 — Harness

**Goal:** New file `packages/fivenines-engine/src/economy.balance.test.ts` only. Target asserts against live `Game`.

**Hard constraints:** no catalog edits; no field rename.

### Verification

```bash
bun test packages/fivenines-engine/src/economy.balance.test.ts
```

Expect fail. Other engine tests stay green.

### Documentation before PR

None until phase 2.

---

## Phase 2 — Policies

**Goal:** Make the harness green with catalog + PAYG unit only.

- Rename `paygCentsPerHandled` → `paygCentsPerThousandHandled`; `floor(handled * rate / 1000)`
- Category rates: portfolio 300, saas 450, shopping 600
- `STARTING_CASH_CENTS` ≈ 25_000 (one Bronze + runway; Gold still unaffordable)
- Absolute maintenance rises with SKU size; unit maint/compute still improves; thin-ram trap
- Opening `creditPpm` 1_000_000 so a 0% week cannot keep recurring
- Opening fixtures: per-category commercial, not one stub for all ten
- Update unit tests that assumed 1¢/request, 40_000 start, or falling absolute maint
- 1400 physics proofs stay green

### Verification

```bash
bun test packages/fivenines-engine
bun test apps/web/src/routes/lab.test.tsx
bun run turbo run typecheck --filter=@packages/fivenines-engine --filter=@apps/web
bun overall
```

### Documentation before PR

- `packages/fivenines-engine/AGENTS.md`
- `apps/web/AGENTS.md` only if lab copy names the PAYG unit
- Root README/AGENTS only if start-cash / PAYG unit is stated there

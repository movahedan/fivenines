# Engine billing and SLA credits (slice B)

Approved chat (2026-09-07). Third initiative (**A → C → B+credits**). Per-project contracts only; customer multipliers and industry rate cards are later.

Depends on: [opex](fivenines-engine-opex.design.md) (wallet), [SLA measurement](fivenines-engine-sla.design.md) (handled / emitted attribution). Ship after A and C so `/lab` does not merge-conflict.

Package stays `@packages/fivenines-engine`. Integers only. 1 `tick()` = 1 simulated hour.

---

## Outcome

A served project:

- Accrues **PAYG** each hour: `handled * paygCentsPerHandled` into `cashCents` and a period bucket
- At **global week close** (`hourIndex % 168 === 0` after increment): **prorated recurring**, then **T1 credit** if period availability &lt; `targetPpm`
- Keeps up to **8** `settlements` (AA1 + cap-K)

`/lab` shows this-period PAYG, hours served, last settlement, and the compact history.

---

## Contract noun (Q1 / R1 / S4 / Y1)

Commercial fields live on a required **`commercial`** object on every `ProjectInitial` / `Project` (no category/industry defaults in this slice). That blob is the project rate card, not the player–customer MSA (multipliers on `Customer` later).

| Field | Rule |
|-------|------|
| `paygCentsPerHandled` | ≥ 0 |
| `recurringCentsPerPeriod` | ≥ 0 |
| `targetPpm` | integer ppm |
| `creditPpm` | fraction of **period revenue** credited on miss |

| Field | Rule |
|-------|------|
| `paygCentsPerHandled` | ≥ 0 |
| `recurringCentsPerPeriod` | ≥ 0 |
| `targetPpm` | integer ppm |
| `creditPpm` | fraction of **period revenue** credited on miss |

At least one of PAYG / recurring must be > 0. Accept does not copy a catalog card; construct already has terms.

Customer-level multipliers = a **different** future contract (scales all projects). Not in B.

---

## Opening Shift stub card

All ten opening projects use this until an industry table exists. Fixtures/tests may override.

| Field | Value |
|-------|------:|
| `paygCentsPerHandled` | 1 |
| `recurringCentsPerPeriod` | 2_000 |
| `targetPpm` | 990_000 |
| `creditPpm` | 100_000 |

---

## Clocks

| Clock | Role |
|-------|------|
| `SLA_WINDOW_HOURS` (168) | Sliding **busy-hour** HUD ppm (slice C). **Not** used for credits. |
| Billing period 168 | **U1** global wall clock. Close when `hourIndex % 168 === 0` after increment. First close after 168 ticks from 0. |
| `SETTLEMENT_HISTORY_K` | **8** |

PAYG unit **W1**: handled only.

Z2: credit uses **period** `handled`/`emitted` (omit emit-0 hours from ppm). Idle served hours still increment `hoursServedInPeriod` for **V1** recurring proration.

---

## Tick order (once A+C exist)

1. Physics + attribution (C) + opex (A).
2. Served projects: PAYG; update period buckets; `hoursServedInPeriod += 1` (emit-0: no PAYG, no period handled/emitted).
3. `hourIndex += 1`.
4. If `hourIndex % 168 === 0`: close each project with `hoursServedInPeriod > 0`.

Jailed: still accrue and close. `acceptProject` / `buyServer` remain blocked by A.

---

## Close (T1 + V1)

```
recurring     = floor(recurringCentsPerPeriod * hoursServedInPeriod / 168)
cash         += recurring
periodRevenue = periodPaygCents + recurring
periodPpm     = periodEmitted === 0 ? null
              : floor(periodHandled * 1_000_000 / periodEmitted)
credit        = periodPpm === null || periodPpm >= targetPpm ? 0
              : min(periodRevenue, floor(periodRevenue * creditPpm / 1_000_000))
cash         -= credit
```

Push `{ periodIndex, hoursServedInPeriod, paygCents, recurringCents, creditCents, periodPpm, periodRevenueCents }`; `slice(-8)`; reset period fields.

`periodIndex = hourIndex / 168` after increment (1-based week number is `hourIndex / 168`).

Offered/declined: no close row.

---

## Lab

Keep A + C displays. Add this-period PAYG, hours served this week, last settlement, list of ≤8 closes.

---

## Non-goals

Customer MSA multipliers, industry defaults, prestige/garnish/jail release, credit tiers, Nest/Prisma `Invoice`, unbounded history.

---

## Proofs

PAYG math; emit-0 hour counts for recurring not PAYG; U1 close; V1 proration; miss credit; hit → 0 credit; `periodEmitted === 0` → 0 credit; cap 8; physics 1400 unchanged.

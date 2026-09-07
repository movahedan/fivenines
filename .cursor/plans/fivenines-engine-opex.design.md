# Engine opex and cash wallet (slice A)

Approved chat (2026-09-07). First money initiative. Follows **A → C → B+credits**. Does not implement SLA or revenue.

Package stays `@packages/fivenines-engine`. Integers only. 1 `tick()` = 1 simulated hour. Cash is **signed integer cents**.

Related later (not this spec): SLA measurement (slice C), billing + credits (slice B), prestige / jail garnish.

---

## Outcome

A constructed `Game` can:

- Start with **40_000** cents unless `GameInitial.cashCents` overrides
- Debit **purchase** on `buyServer`; credit **70% salvage** on `sellServer`
- Each tick, after physics, subtract **maintenance + utilization-interpolated power** for every owned server
- Allow **negative cash**
- Set sticky **`jailed`** when `cashCents <= -20_000`
- While jailed: reject `buyServer` and `acceptProject`; still allow `sellServer` and `tick`

`/lab` shows cash, last-hour opex (maintenance vs power), and jailed; disables illegal buy/accept.

Capacity Phase 4 (region picker) is already merged; this slice may edit lab.

---

## Wallet (J1)

`Game` holds:

| Field | Meaning |
|-------|---------|
| `cashCents` | Signed integer. May be negative. |
| `jailed` | Sticky `true` after the debt tripwire. Never clears in this slice. |

No append-only ledger. Default construct: `cashCents = STARTING_CASH_CENTS` (40_000), `jailed = false`.

`GameInitial` may pass `cashCents` and `jailed` for fixtures.

---

## Catalog (`catalog/economy-policy.ts`)

Salvage is **one policy**, not per-SKU: **70%** → `floor(purchaseCents * 70 / 100)`.

| Constant | Value |
|----------|------:|
| `STARTING_CASH_CENTS` | 40_000 |
| `DEBT_LIMIT_CENTS` | 20_000 (jail when `cashCents <= -DEBT_LIMIT_CENTS`) |
| `SALVAGE_PERCENT` | 70 |

SKU money (purchase above 40_000 = unreachable on the opener):

| SKU | purchase | with $400 | maint /h | idle power /h | max power /h |
|-----|--------:|-----------|--------:|--------------:|-------------:|
| bronze | 16_000 | two, or one + thin-ram | 80 | 35 | 120 |
| silver | 28_000 | one | 55 | 60 | 220 |
| gold | 48_000 | no | 40 | 100 | 380 |
| platinum | 72_000 | no | 28 | 160 | 600 |
| diamond | 120_000 | no | 18 | 280 | 1_000 |
| thin-ram | 14_000 | yes (trap) | 90 | 45 | 150 |

Better SKUs cost **less** maintenance per hour (efficiency). Power still scales up with size. `thin-ram` stays a high-maint trap.

No SKU unlock / checkpoint flags. Gold+ are price-gated only.

---

## Power and opex (A2)

Per server, using **this hour’s** `server.metrics.utilization` (tightest-axis `ratioPercent`, may exceed 100):

```
utilForPower = min(utilization, 100)
powerCents   = idlePowerCentsPerHour
             + floor((maxPowerCentsPerHour - idlePowerCentsPerHour) * utilForPower / 100)
opexCents    = maintenanceCentsPerHour + powerCents
```

- `assignedRequests === 0` ⇒ utilization 0 ⇒ **maintenance + idle power** still charged.
- Overload (`utilization > 100`) bills **max power**, not above TDP.
- Empty fleet ⇒ total opex 0.
- `dispatch` does not charge hourly opex.

---

## Tick order

1. Existing physics: demand, `server.tick`, game/project metrics.
2. Sum opex across servers; record last-tick finance (`opexCents`, `maintenanceCents`, `powerCents` totals).
3. `cashCents -= totalOpex` (may go negative).
4. If `cashCents <= -DEBT_LIMIT_CENTS` → `jailed = true` (sticky).
5. `hourIndex += 1` (unchanged).

---

## Commands

| Command | Cash | Jail |
|---------|------|------|
| `buyServer` | Throw if `jailed`. Throw if `cashCents < purchaseCents` (no debit). Else debit purchase, add server. |
| `sellServer` | Allowed while jailed. Credit salvage, remove server. |
| `acceptProject` | Throw if `jailed`. No cash change. |

Buy never uses debt as credit: `-5_000` cash cannot buy a 16_000 Bronze.

Throws match existing engine command errors. Lab shows them via `lastError`.

---

## Finance snapshot

Alongside `game.metrics`, last tick exposes:

- `cashCents`, `jailed`
- `opexCents`, `maintenanceCents`, `powerCents` (fleet totals that hour)

No per-server invoice table in v1.

---

## Lab

Finance strip: cash, jailed, last opex with maintenance vs power.

- Disable **Buy** when jailed or `cashCents < purchase` (Gold/Platinum/Diamond start disabled).
- Disable **Accept** when jailed.
- **Sell** enabled if a server exists.
- **Reset** restores starting cash and `jailed === false`.

---

## Proofs

Physics fixtures (1400, placement) keep the same handled/dropped; starting cash is 40_000; one tick of Bronze opex must not alter those metrics.

Money tests: construct override; buy debit / refuse short / refuse jailed; sell 70% including jailed; accept refuse jailed; idle opex; busy power in [idle, max]; util > 100 → max power; drain to jail sticky after a sell that raises cash; empty fleet opex 0.

---

## Non-goals

Revenue, SLA, invoices, prestige, garnish, jail release, SKU unlocks, Nest, serialize/replay, per-server line items, electricity as a world resource, `bun overall` as this slice’s gate (phase commands below).

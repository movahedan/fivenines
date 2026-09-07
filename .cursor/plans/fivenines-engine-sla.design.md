# Engine SLA measurement (slice C)

Approved chat (2026-09-07). Second money-adjacent initiative (**A → C → B+credits**). Measurement only: no target %, no credits, no invoices.

Package stays `@packages/fivenines-engine`. Integers only. 1 `tick()` = 1 simulated hour.

Opex/cash: [fivenines-engine-opex.design.md](fivenines-engine-opex.design.md) (may or may not be merged; C does not read the wallet).

---

## Outcome

A constructed `Game` can:

- Tag demand slices with `projectId`
- Attribute each served project’s **handled** vs **misses** this hour (capacity drops on boxes + unroutable leftover)
- Expose this-hour `availabilityPpm` (or `null` if emitted is 0)
- Keep a sliding ring of up to **168** busy hours per project and expose `windowAvailabilityPpm`

`/lab` shows those two numbers on **served** project rows.

---

## Policy

`catalog/sla-policy.ts`:

| Constant | Value |
|----------|------:|
| `SLA_WINDOW_HOURS` | 168 (7×24) |

One SLA scalar (M1): **no** separate night/day SLO. Circadian behavior stays traffic (`localHour` / category rhythm).

---

## Attribution (this hour)

Placement unchanged except slices include `projectId`.

Per served project:

| Qty | Definition |
|-----|------------|
| `emitted` | Demand R this hour |
| `assigned` | Sum of that project’s slice `requests` on all servers |
| `unroutable` | `emitted - assigned` |
| capacity drop | Share of each box’s `droppedRequests` proportional to this project’s requests on that box (floor + remainder, same pattern as demand split) |
| `handled` | Attributed handled; `handled + unroutable + capacityDrop = emitted` |

`availabilityPpm = floor(handled * 1_000_000 / emitted)` when `emitted > 0`. Unroutable is a **miss**.

p95 / `errorPpm` stay physics metrics, **not** the SLA number (N1).

---

## Ring (L4 / K2)

Each `Project` holds this-hour fields plus a ring of `{ handled, emitted }`.

- If `emitted === 0` (offered, declined, or zero demand): **do not** append; this-hour ppm is `null`.
- If `emitted > 0`: append; if `length > SLA_WINDOW_HOURS`, drop oldest.
- `windowAvailabilityPpm = floor(sumHandled * 1_000_000 / sumEmitted)` over slots; `sumEmitted === 0` → `null`.
- Partial window is valid.
- `dispatch` (accept/decline) does not rewrite past slots.

Implementation lives on `Project` next to `project.metrics.ts` (P1).

---

## Lab (O2)

Served row: this-hour ppm and window ppm (`—` when `null`). Offered/declined: no SLA digits. No sparkline.

---

## Proofs

- Conservation: per project `handled + unroutable + capacityDrop = emitted`; sum of project handled = game handled (unroutable sits in game dropped).
- Empty fleet: ppm 0 that hour; ring records `{ handled: 0, emitted: R }`.
- Offered: ring unchanged.
- Zero-emit hour not appended.
- Ring length ≤ 168; sliding sum.
- Bronze 1400: physics handled/dropped unchanged; served projects ppm &lt; 1_000_000.

---

## Non-goals

SLA target percent, credits, reputation, `contract.failed`, night SLO, Nest, serialize, cash coupling.

## Build order

Independent of opex **code**. Preferred ship order: **opex (A) then SLA (C)** so `/lab` HUD changes do not collide.

# Engine traffic profiles (v1)

Approved chat model (2026-09-06). Extends [fivenines-engine-domain.design.md](fivenines-engine-domain.design.md): served demand is no longer a constant `estimatedRequestsPerHour` except on explicit constant projects.

Package stays `@packages/fivenines-engine`. Integers only at the demand boundary. 1 `tick()` = 1 simulated hour. Live RNG in the lab; injected RNG in tests.

---

## Outcome

A constructed `Game` can:

- Track `hourIndex` (starts at `0`)
- Emit **shaped** demand per served project from category + timezone + campaign trait + optional campaign window + live jitter + multi-hour spikes
- Keep **constant** demand on kernel overload fixtures so one Bronze drops and two Bronze clear at **1400**
- Tune every multiplier from **one policy file** without editing rhythm/spike classes

Lab `/lab` shows the clock and uses shaped demand on the opening board.

---

## Clock

`Game` owns `hourIndex: number`, starting at `0`.

Each `tick()`:

1. Compute served demand for the **current** `hourIndex`
2. Assign to servers / roll up metrics (unchanged)
3. Set `hourIndex` to `hourIndex + 1`

Derived (not stored): `hourOfDay = hourIndex % 24`, `dayIndex = Math.floor(hourIndex / 24)`.

`dispatch` does not change `hourIndex`.

First Tick is hour `0` (midnight on day `0`).

---

## Random source

```ts
interface RandomSource {
  nextUnit(): number; // in [0, 1)
}
```

`new Game(initial, options?: { random?: RandomSource })`.

Default: wrap `Math.random`. Demand code calls `random.nextUnit()` only — never `Math.random` directly.

Tests pass a sequence or a stub. Lab uses the default.

---

## Project construction

```ts
type ProjectCategory = "shopping" | "saas" | "portfolio";

type DemandKind = "constant" | "shaped";

interface CampaignWindow {
  startHour: number;      // inclusive, game hourIndex
  durationHours: number;  // positive integer
}

interface ProjectInitial {
  id: string;
  estimatedRequestsPerHour: number; // baseline; finite non-negative integer
  status: ProjectStatus;
  demand: DemandKind;
  category: ProjectCategory;
  timezoneHours: number;            // integer in [-12, 14]
  campaignProne: boolean;
  campaign?: CampaignWindow;
}
```

- `demand: "constant"` — `tick` returns `baseline` when served, else `0`. Ignores clock, rhythm, campaign, spikes, jitter.
- `demand: "shaped"` — uses `ProjectDemand` as specified below.
- Unknown `category` or `timezoneHours` out of range **throws** at construct.
- `campaign.durationHours` must be a positive integer; `startHour` a non-negative integer.

`acceptProject` copies these fields; it does not reset spike state (spike state starts empty on construct).

Kernel fixtures: both served projects `demand: "constant"`, `category: "saas"`, `timezoneHours: 0`, `campaignProne: false`, no `campaign`.

Opening board: all `demand: "shaped"`, mix of three categories, mixed offsets, some `campaignProne`, one or two with a `campaign` window.

---

## OOP split

| Type | Role |
|------|------|
| `Project` | Identity, status, baseline, traits. Owns a `DemandModel`. `tick(hourIndex, random)` returns integer demand or `0` if not served. |
| `DemandModel` | Interface: `demandFor(hourIndex, random): number`. |
| `ConstantDemand` | Returns baseline. |
| `ProjectDemand` | Shaped pipeline: local hour → rhythm → campaign window → spike → jitter → floor. Holds spike state. |
| `CategoryRhythm` | Interface: `permilleForLocalHour(localHour: 0–23): number`. |
| `ShoppingRhythm` / `SaasRhythm` / `PortfolioRhythm` | Read **policy tables** only. No magic numbers in methods. |

`Project` is not subclassed per category. Factory: `demand === "constant"` → `ConstantDemand`, else `ProjectDemand` with rhythm from `category`.

Existing `src/demand.ts` (`assignDemandByCpuCap`) is **fleet split**, not traffic. Do not overload that file.

---

## Policy file (tunables)

**Path:** `packages/fivenines-engine/src/catalog/traffic-policy.ts`

This is the only place for:

- Rhythm permille tables (per category, per local-hour band)
- Campaign window permille
- Fat spike: duration hours, permille, trigger per-1000 (`campaignProne` vs not)
- Weak spike: duration hours, permille, trigger per-1000
- Jitter permille min (inclusive) and span (so mapped range is `[min, min + span)`)
- Timezone allowed range

Rhythm classes and `ProjectDemand` import this module. Changing game feel = edit this file (+ tests that pin exact numbers, if any).

### v1 numbers (copy into the policy file)

Permille: `1000` = ×1.

**Rhythm (local hour)**

| Local hour | Shopping | SaaS | Portfolio |
|------------|----------|------|-----------|
| 0–7 | 400 | 200 | 500 |
| 8–11 | 700 | 1100 | 600 |
| 12–13 | 900 | 800 | 600 |
| 14–16 | 900 | 1200 | 700 |
| 17–22 | 1400 | 400 | 500 |
| 23 | 800 | 300 | 500 |

Bands are inclusive on both ends. Hour `23` is its own band.

- Campaign active: `1500`, else `1000`
- Fat spike: duration `48`, permille `2000`, trigger `80` / `20` per 1000 (`campaignProne` / not)
- Weak spike: duration `3`, permille `1250`, trigger `150` per 1000
- Jitter: min `850`, span `300` → permille `850–1149` via `min + floor(nextUnit() * span)`

---

## Local hour

```
localHour = ((hourIndex + timezoneHours) % 24 + 24) % 24
```

(Always `0–23`, including negative offsets.)

---

## Shaped demand formula

When served and `demand === "shaped"`:

```
demand = floor(
  baseline
  * rhythmPermille
  * campaignPermille
  * spikePermille
  * jitterPermille
  / 1000 / 1000 / 1000 / 1000
)
```

Result `>= 0` (floor of non-negative inputs). Offered / declined: `0` (do not roll spikes or consume extra `nextUnit` for those projects — skip the model).

**Campaign window:** active iff `campaign` is set and `hourIndex >= startHour` and `hourIndex < startHour + durationHours`.

**Spikes** (state on `ProjectDemand`: `remainingHours` + `permille`):

1. If `remainingHours > 0`: use stored permille, then `remainingHours -= 1`. Do not roll a new spike.
2. Else draw `nextUnit()`:
   - Fat if `floor(u * 1000) < fatThreshold` (80 or 20). This hour uses fat permille. Set `remainingHours` to `duration - 1` (47) so the spike lasts **48 ticks including this one**.
   - Else draw **another** `nextUnit()`: weak if `floor(u * 1000) < 150`. This hour uses weak permille. Set `remainingHours` to `2` (3 ticks including this one).
   - Else spike permille `1000` (idle), `remainingHours` stays `0`.

**Jitter:** always one `nextUnit()` per shaped served project per tick, after spike resolution.

Call order per shaped served project per tick: rhythm (pure) → campaign (pure) → spike (`0–2` randoms) → jitter (`1` random). Tests that inject a queue must follow this order.

---

## Tick vs metrics

Fleet assignment and server metrics **unchanged**. Only the integer **sum** of served project demand changes.

Empty fleet + shaped served demand still counts as unroutable drops.

---

## Lab

- Display `hourIndex`, hour-of-day, day index next to Tick.
- Opening fixture: still 4 customers, ≥10 offered shaped projects, `assets: []`.
- Mix categories, `timezoneHours`, `campaignProne`, and at least one `campaign` window.
- No start-campaign button in v1.
- Reset reconstructs `openingInitial` and `hourIndex = 0`.

---

## Tests

Engine:

- Overload fixtures still: one Bronze `droppedRequests > 0`; two Bronze `droppedRequests === 0` and lower p95; offered/declined extras do not change **1400** (constant demand).
- Injected `RandomSource`: shopping shaped demand at local 20 > local 4 (same baseline, no campaign, stub rng that never triggers spikes and uses midpoint jitter).
- SaaS: local 10 > local 3 under the same stub.
- Campaign window: hour inside window > adjacent hour outside, same stub.
- Fat spike: stub that always triggers fat on first draw; demand stays boosted for 48 ticks then falls.
- `timezoneHours: -3` shifts which `hourIndex` maps to shopping evening vs the `0` offset project.
- Construct throws on bad timezone / unknown category / non-positive campaign duration.

Lab: clock text present after Tick; opening still “No servers”; Accept + Tick with empty fleet still drops.

Avoid pinning full opening-board demand to exact integers (live rng). Prefer inequalities or injected rng in engine tests.

---

## Files (expected)

| Path | Responsibility |
|------|----------------|
| `src/catalog/traffic-policy.ts` | All tunables |
| `src/traffic/random-source.ts` | `RandomSource` + `MathRandomSource` |
| `src/traffic/category-rhythm.ts` | Interface + three rhythms reading policy |
| `src/traffic/project-demand.ts` | `DemandModel`, `ConstantDemand`, `ProjectDemand` |
| `src/project.ts` | New fields; `tick(hourIndex, random)` |
| `src/game.ts` | Clock; pass hour + random into projects |
| `src/game.utils.ts` | Copy new fields on accept |
| `src/fixtures.ts` | Constant vs shaped initials |
| `src/index.ts` | Export clock-related types if lab needs them |
| `apps/web/src/lab/lab-session.tsx` | Clock display |

---

## Out of scope

- More categories, weekends, locale lists as extra clocks
- `dispatch` to start/stop campaigns
- Nest / Prisma / money / SLA
- Load balancers
- Seeded replay of a whole run (v1 is live rng + test injection only)

---

## Compatibility note

Domain spec still says “emit estimate from construction.” This file **replaces** that for `demand: "shaped"`. Constant projects preserve the overload proofs. Server catalog names remain Bronze–Diamond (not Tiny).

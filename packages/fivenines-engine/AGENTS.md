# AGENTS.md

**@packages/fivenines-engine** — pure simulation kernel (OO `Game` graph). Workspace `name` is **`@packages/fivenines-engine`** (singular `@package`). Path: `packages/fivenines-engine`.

**Code review:** [`.github/instructions/engine.instructions.md`](../../.github/instructions/engine.instructions.md) (shared with GitHub Copilot). This file stays implementation truth.

`@apps/web` `/lab` constructs `Game` on the client (Opening Shift). Nest is the future production caller.

## Commands

```bash
bun test packages/fivenines-engine
bun run turbo run typecheck --filter=@packages/fivenines-engine
bun run turbo run test --filter=@packages/fivenines-engine
```

Package scripts: `typecheck` (`tsc --noEmit`), `test` (re-roots to repo `bun test`).

## Graph

`Game` owns `customers[]` and `assets[]` (`Server` only). A served project carries exactly **one** `RouteTarget` (`{ kind: "server"; serverId }`) on the project itself. Still no load balancers, no route arrays, no balancer pools.

| Noun | Role |
|------|------|
| `Customer` | Org with `projects[]`. Does not emit load. |
| `Project` | `offered` \| `declined` \| `served` \| `offline`. Served demand is integer RPS from a `DemandModel`. `offline` is a parked project: contract kept, nothing running, no route. |
| `Server` | Inventory. Empty fleet: nothing can be accepted at all, because accept requires an existing `serverId`. Each box has a `region` (same enum as projects). |

Ids are unique per game (`customer.id`, `project.id` global, `asset.id`) via `@packages/shared/ids`. Construct throws on duplicates.

Tick walks each served project: `placeProjectDemand` puts the hour on the **one** routed box, capped by that box’s `remainingHeadroom`; the leftover is **unroutable** `droppedRequests`. There is no pool, no local-first preference, and no cross-region overflow — an overloaded project drops rather than borrowing headroom from another box. A project whose route is absent (parked) is fully unroutable. Slices are `{ category, requests, sourceRegion, remote, projectId }`; `assignSlice` derives `remote` from `sourceRegion !== server.region`. Cross-region routing stays legal and still costs extra p95 on the box: `|offsetHours| × PLACEMENT_POLICY.latencyMsPerOffsetHour` (v1: `5` in `src/catalog/placement-policy.ts`), mixed by slice request counts (`regions.remoteLatencyMs`).

On each box, `server.tick` converts slices via `CAPACITY_POLICY` (`src/catalog/capacity-policy.ts`): v1 `cpuPerRequest = 1` for all categories; shopping/saas/portfolio differ on `bytesPerRequest` (40/10/20) and `memPerInflight` (2/4/1). `cpuLoad` / `netLoad` are per assigned request this hour. `inFlight = floor(assigned × inflightPerThousandRequests / 1000)` (v1: 10). `memOcc = baseMemoryMiB + inFlight ×` request-weighted `memPerInflight`. Handled scales by the **min** finite cap/load ratio (floor) across CPU/net/RAM; leftover on that box is dropped. Utilization is the **tightest** axis.

Catalog: Bronze–Diamond plus teaching `thin-ram` (`SERVER_CATALOG`). Bronze = compute **1000**, net **1_000_000**, memory **4096**, base **256**. `oneBronzeInitial` routes both **constant** 700 RPS projects to `server-1` (exact **1400** against a 1000 cap, CPU-bound on one Bronze). `twoBronzeInitial` routes one project per box and is the **isolation** fixture: overload on one box never spills onto the other. `openingInitial`: 4 customers, 10 **shaped** offered projects, `assets: []`. Opening `acme-web` baseline is **2000** shopping so a single Bronze cannot 99% an accept-all hog.

Runtime: `@packages/shared/units`, `@packages/shared/ids`. Integers only at the demand boundary. `1 tick() = 1` simulated hour.

## Clock and RNG

`hourIndex` starts at `0`. Each `tick()` uses the **current** hour for demand, rolls physics metrics, attributes per-project SLA, charges opex, accrues PAYG into **accounts receivable**, may trip jail from **cash**, then `hourIndex += 1`. If `hourIndex % PAYG_SETTLE_HOURS === 0` (24), receivable settles into cash. If `hourIndex % BILLING_PERIOD_HOURS === 0`, week close runs. Derived: `hourOfDay = hourIndex % 24`, `dayIndex = floor(hourIndex / 24)`. `dispatch` does not change the clock, does not charge hourly opex, does not accrue PAYG, does not settle receivable, does not close the week, does not rewrite SLA ring slots, and does not emit sim events. Each `tick()` replaces `game.events` (`EngineEvent` in `src/game.events.ts`) with that hour’s **edge** lines only: `slaBreached` / `slaRecovered` (window vs `targetPpm`), `paygSettled`, `weeklyCreditCharged`, `serverSaturated` (utilization ≥ 100), `cashLow` (cash crossing ≤ 0). Construct starts with `events: []`. Event `hourIndex` is the hour just simulated (before the increment).

`new Game(initial, { random?: RandomSource })`. Default wraps `Math.random`. Demand code calls `random.nextUnit()` only.

Opening Shift lasts `OPENING_SHIFT_HOURS` (336 = 14×24) in `src/catalog/opening-shift-policy.ts`. `openingShiftOutcome(snapshot)` is **in_progress** until `hourIndex >= 336`. After that it is **won** only if cash `> 0`, `jailed` is false, at least two **served** projects have `windowAvailabilityPpm >= targetPpm`, and no settlement has `creditCents === periodRevenueCents` with `periodRevenueCents > 0`. Otherwise **lost** (failed reasons: `jailed` / `cash` / `contracts` / `catastrophe`). Pure helper — do not tick 336 hours in tests.

## Project demand

`estimatedRequestsPerHour` is the **baseline**. `demand: "constant"` returns that baseline when served (overload proofs). `demand: "shaped"` uses category rhythm + timezone + optional campaign window + spikes + jitter from `src/catalog/traffic-policy.ts`. Offered / declined return `0` and must not consume RNG.

`ProjectInitial` also requires `category` (`shopping` \| `saas` \| `portfolio`), `region` (`REGION_IDS` in `src/catalog/regions.ts`; unknown id throws), `campaignProne`, optional `campaign: { startHour, durationHours }` (`durationHours >= 1`), and `commercial: CommercialTerms`. Shaped demand uses `regions.offsetHoursFor(region)` for `localHour`. Lab buy default is `DEFAULT_REGION` (`utc+0`).

## Constructor

```ts
import { Game, oneBronzeInitial, twoBronzeInitial } from "@packages/fivenines-engine";

const overloaded = new Game(oneBronzeInitial).tick();
const healthy = new Game(twoBronzeInitial).tick();
```

`GameInitial`: `{ customers, assets, cashCents?, accountsReceivableCents?, jailed? }`. Empty `assets` is valid. Defaults: `cashCents = STARTING_CASH_CENTS` (25_000), `accountsReceivableCents = 0`, `jailed = false` (`src/catalog/economy-policy.ts`). Cash is signed integer cents. Opening cash buys one Bronze (18_000) with runway; Silver and above stay out of reach at start.

A `served` `ProjectInitial` requires a `route`, and a non-served one must not carry one — construct throws either way. `Game` additionally throws when a route names an id absent from `assets`, and re-checks that after every `dispatch`.

After `tick()`, `game.metrics` (`src/game.metrics.ts`), each `server.metrics` (`src/server.metrics.ts`), and each `project.metrics` (`src/project.metrics.ts`) hold that hour’s snapshot. `game.finance` (`src/game.finance.ts`) is the last-hour money snapshot: `cashCents`, `accountsReceivableCents`, `jailed`, fleet totals `opexCents` / `maintenanceCents` / `powerCents`.

## SLA measurement

After `server.tick`, `applyProjectSla` (`src/game.sla.ts`) attributes each project’s **handled** vs misses. Unroutable leftover is a miss. Capacity drops on a box split in proportion to that project’s `requests` on the box (floor + remainder). Conservation: `handled + unroutable + capacityDrop = emitted`. Game `handledRequests` / `droppedRequests` / `errorPpm` stay physics (N1); they are not the SLA scalar.

This-hour `availabilityPpm = floor(handled * 1_000_000 / emitted)` when `emitted > 0`, else `null`. Each `Project` keeps a ring of `{ handled, emitted }` up to `SLA_WINDOW_HOURS` (168 in `src/catalog/sla-policy.ts`). Emit-0 hours (offered / declined / zero demand) are **not** appended; **offline** hours are — a parked project emits, handles 0, and the whole hour lands in the ring as a miss. `windowAvailabilityPpm` is the same floor over ring sums; `null` if `sumEmitted === 0`. Partial windows are valid. The ring has no target %; credits use **period** buckets at week close (Z2), not `windowAvailabilityPpm`. `slaRecoveryHours(samples, targetPpm)` (`src/catalog/sla-policy.ts`) simulates appending 100% hours on that ring (FIFO 168) and returns hours until window ≥ target, or `null` if already meeting, empty, or unreachable in one window. It does not mutate the ring.

## Wallet and opex

Money tunables live in `src/catalog/economy-policy.ts` (not `SERVER_CATALOG`). Salvage is `floor(purchaseCents * SALVAGE_PERCENT / 100)` (`SALVAGE_PERCENT = 70`). Bigger SKUs pay **more** maintenance in absolute cents; maintenance per compute unit still falls; power still scales up with size; `thin-ram` is a high-maint trap. Jail is sticky: `cashCents <= -DEBT_LIMIT_CENTS` (20_000) sets `jailed`; this slice never clears it. Negative cash is allowed; buy still requires `cashCents >= purchaseCents`.

Opex runs **after** `server.tick` / `measureGameTick`, **before** `hourIndex += 1`. Per box, using this hour’s `server.metrics.utilization` (tightest axis; 0 when `assignedRequests === 0`; may exceed 100):

```
utilForPower = min(utilization, 100)
powerCents   = idle + floor((max - idle) * utilForPower / 100)
opexCents    = maintenance + powerCents
```

Idle boxes still pay maintenance + idle power. Overload bills **max** power, not above TDP. Empty fleet opex is 0. Then `cashCents -= totalOpex`. Served PAYG is added to `accountsReceivableCents`, not cash. Jail trips after the opex cash move (receivable does not delay jail).

## Billing (PAYG)

Commercial tunables live in `src/catalog/commercial-policy.ts`. Every project must have `commercial: { paygCentsPerThousandHandled, recurringCentsPerPeriod, targetPpm, creditPpm }`. PAYG and recurring ≥ 0 integers; at least one > 0; `targetPpm` / `creditPpm` finite integers. Construct throws otherwise. `acceptProject` copies `commercial` (`asServed`); it does not invent a catalog card. Player–customer MSA (multipliers) is a **different** contract noun later — not fields on `Project`.

Opening cards come from `commercialTermsForCategory` (portfolio 330 / saas 450 / shopping 650 cents per thousand handled; recurring 800 / 1_500 / 2_500; target 990_000; credit 1_000_000). `OPENING_COMMERCIAL_STUB` is the saas card. Overload fixtures use `PAYG_ONLY_COMMERCIAL_STUB` (1000 cents per thousand so PAYG equals handled count). Opening `acme-web` target is **995_000**; `initech-tps` is **980_000**.

After opex, served projects accrue `paygCentsForHandled(handled, paygCentsPerThousandHandled)` into **period buckets** and `game.accountsReceivableCents` (`Project.accruePeriodPayg()`, helper of the same name in `game.commercial.ts`). Emit-0: no PAYG and no period handled/emitted; still increment `hoursServedInPeriod`. **Offline**: no PAYG and **no** `hoursServedInPeriod` bump (recurring sleeps), but `periodHandled` / `periodEmitted` still grow, so the period SLA and any credit see the downtime. Offered/declined: no PAYG. Jailed games still accrue receivable.

After `hourIndex += 1`, if `hourIndex % PAYG_SETTLE_HOURS === 0` (24), `cashCents += accountsReceivableCents` and receivable resets to 0.

If `hourIndex % BILLING_PERIOD_HOURS === 0` (168), close each project with `hoursServedInPeriod > 0 || periodEmitted > 0` — a fully parked week still settles (recurring prorates to 0) and its period buckets reset instead of leaking misses into the next period:

```
recurring = floor(recurringCentsPerPeriod * hoursServedInPeriod / 168)
periodPpm = slaAvailabilityPpm(periodHandled, periodEmitted)  // Z2; not windowAvailabilityPpm
creditPpm = slaCreditPpm(periodPpm, targetPpm)
          // 0 if null or >= target
          // 250_000 if periodPpm >= 950_000
          // 500_000 if periodPpm >= 800_000
          // 1_000_000 otherwise
credit    = min(periodRevenue, floor(periodRevenue * creditPpm / 1_000_000))
```

`periodRevenue = periodPaygCents + recurring`. Cash += recurring − credit. Push a settlement (`periodIndex = hourIndex / 168`); keep `SETTLEMENT_HISTORY_K` (8). Reset period buckets. Offered/declined skip. Jail still closes.

## `dispatch`

`dispatch(command)` mutates the graph immediately. It does **not** call `tick()`, does not update metrics, and does not advance `hourIndex`. Unknown `type` throws.

```ts
type EngineCommand =
  | { type: "acceptProject"; payload: { projectId: string; serverId: string } }
  | { type: "declineProject"; payload: { projectId: string } }
  | { type: "moveProject"; payload: { projectId: string; serverId: string } }
  | { type: "unassignProject"; payload: { projectId: string } }
  | { type: "assignProject"; payload: { projectId: string; serverId: string } }
  | { type: "buyServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
  | { type: "sellServer"; payload: { serverId: string } };
```

| Command | Transition |
|---------|------------|
| `acceptProject` | `offered` → `served` on `serverId` (**breaking**: the payload gained `serverId`) |
| `declineProject` | `offered` → `declined` (`Project.asDeclined()`) |
| `moveProject` | `served` → `served` on another box |
| `unassignProject` | `served` → `offline`, clearing the route (park) |
| `assignProject` | `offline` → `served` on `serverId` |

Unknown project id or wrong source status throws. No command changes cash except `buyServer` / `sellServer`. Any command carrying a `serverId` throws `unknown server id` when the box is absent.

`acceptProject` and `buyServer` throw while `jailed`; `moveProject` / `unassignProject` / `assignProject` / `sellServer` / `declineProject` are allowed while jailed.

`buyServer` throws if `jailed` or `cashCents < purchaseCents` (no debit). Else debit catalog purchase and add the box.

`sellServer` credits salvage and removes the box. It throws while a **served** project routes to that box; a **parked** project does not pin its old box, so park-then-sell works.

Implementation: `applyCommand` in `src/game.utils.ts`.

## Related

- Hosting platform initiative: `.cursor/plans/fivenines-hosting-platform.plan.md` — design `.cursor/plans/fivenines-hosting-platform.design.md`
- Billing / PAYG: `.cursor/plans/fivenines-engine-billing.plan.md` — spec `.cursor/plans/fivenines-engine-billing.design.md`
- Balance harness: `src/economy.balance.test.ts` — plan `.cursor/plans/fivenines-engine-balance.plan.md`
- SLA: `.cursor/plans/fivenines-engine-sla.plan.md` — spec `.cursor/plans/fivenines-engine-sla.design.md`
- Opex / cash: `.cursor/plans/fivenines-engine-opex.plan.md` — spec `.cursor/plans/fivenines-engine-opex.design.md`
- Plan: `.cursor/plans/fivenines-engine-capacity.plan.md` (region / placement; traffic: `.cursor/plans/fivenines-engine-traffic.plan.md`)
- Spec: `.cursor/plans/fivenines-engine-capacity.design.md`
- Domain (kernel graph): `.cursor/plans/fivenines-engine-domain.design.md`

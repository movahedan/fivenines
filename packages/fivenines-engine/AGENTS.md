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
| `Project` | `offered` \| `accepted` \| `declined` \| `expired` \| `withdrawn` \| `served` \| `offline`. `accepted` is setup: contract signed, no route, no live demand. Served demand is integer RPS from a `DemandModel`. `offline` is a parked project: contract kept, nothing running, no route. Park (`unassignProject`) throws on `accepted`. |
| `Server` | Inventory. Empty fleet is valid; `acceptProject` does not require a box. Live routing still needs a `serverId` on `startProject`. Each box has a `region` (same enum as projects) and a `tenure`: `{ kind: "owned"; purchaseCents }` or `{ kind: "leased"; hourlyCents }`. Physics (compute, net, RAM) do not change with tenure. Omitted `AssetInitial.tenure` defaults to owned at catalog purchase. Tenure cents are non-negative integers (`src/server.ts`). |

Ids are unique per game (`customer.id`, `project.id` global, `asset.id`) via `@packages/shared/ids`. Construct throws on duplicates.

Tick walks each served project: `placeProjectDemand` puts the hour on the **one** routed box, capped by that box’s `remainingHeadroom`; the leftover is **unroutable** `droppedRequests`. There is no pool, no local-first preference, and no cross-region overflow — an overloaded project drops rather than borrowing headroom from another box. A project whose route is absent (parked) is fully unroutable. Slices are `{ category, requests, sourceRegion, remote, projectId }`; `assignSlice` derives `remote` from `sourceRegion !== server.region`. Cross-region routing stays legal and still costs extra p95 on the box: `|offsetHours| × PLACEMENT_POLICY.latencyMsPerOffsetHour` (v1: `5` in `src/catalog/placement-policy.ts`), mixed by slice request counts (`regions.remoteLatencyMs`).

On each box, `server.tick` converts slices via `CAPACITY_POLICY` (`src/catalog/capacity-policy.ts`): v1 `cpuPerRequest = 1` for all categories; shopping/saas/portfolio differ on `bytesPerRequest` (40/10/20) and `memPerInflight` (2/4/1). `cpuLoad` / `netLoad` are per assigned request this hour. `inFlight = floor(assigned × inflightPerThousandRequests / 1000)` (v1: 10). `memOcc = baseMemoryMiB + inFlight ×` request-weighted `memPerInflight`. Handled scales by the **min** finite cap/load ratio (floor) across CPU/net/RAM; leftover on that box is dropped. Utilization is the **tightest** axis.

Catalog: Bronze–Diamond plus teaching `thin-ram` (`SERVER_CATALOG`). Bronze = compute **1000**, net **1_000_000**, memory **4096**, base **256**. `oneBronzeInitial` routes both **constant** 700 RPS projects to `server-1` (exact **1400** against a 1000 cap, CPU-bound on one Bronze). `twoBronzeInitial` routes one project per box and is the **isolation** fixture: overload on one box never spills onto the other. `openingInitial`: Maya / Maya's Appointments only (`appointment-site` commercial, weekly fee 80 design units → 8000¢ via `DESIGN_UNIT_CENTS`, SLA 80% → 800_000 ppm, PAYG 0, baseline 120, `offerTtlHours: 48`), `assets: []`. Opening Shift still requires two **served** contracts to win. Completing the first-project setup checklist marks `ready`; it does not call `startProject`. After the first offer leaves pending (accept, decline, expire, or cancel setup), another acquaintance-style appointment may spawn after 24h when pending cap is 1. Live RPS for that appointment still uses saas `ProjectDemand` in `Game.tick` — DemandEngine is not placed.

Runtime: `@packages/shared/units`, `@packages/shared/ids`. Integers only at the demand boundary. `1 tick() = 1` simulated hour.

## Clock and RNG

`hourIndex` starts at `0`. `tick()` is a named playlist on one `TickContext` `{ hour, cash, events, rng }`, not a plugin registry: reset → demand/place → server physics → SLA → opex → learning → operations (`OperationalQueue`, one slot) → PAYG accrue → jail → `hour += 1` → daily settle → contract calendar → spawn → week close → cashLow events. Then Game writes `ctx.hour` / `ctx.cash` / `ctx.events` back. Demand uses the hour before the increment (`project.tick`); calendar uses the hour after (`project.tickCalendar`, `spawnAcquaintanceIfDue`, `Project.closeIfDue`). Refunds and opex/learning/settle/close go through `postCashDelta` on `ctx.cash`. If `hourIndex % PAYG_SETTLE_HOURS === 0` (24), receivable settles into cash. Each **served** project closes when `(hourIndex - billingOriginHour) % BILLING_PERIOD_HOURS === 0`. Served teaching fixtures set `billingOriginHour: 0` so the first close still lands at hour 168. `accepted` projects have no origin and do not close. Daily AR settle stays global (`hourIndex % 24 === 0`). Derived: `hourOfDay = hourIndex % 24`, `dayIndex = floor(hourIndex / 24)`. `dispatch` does not change the clock, does not charge hourly opex, does not accrue PAYG, does not settle receivable, does not close the week, does not rewrite SLA ring slots, and does not emit sim events. Each `tick()` replaces `game.events` (`EngineEvent` in `src/game.events.ts`) with that hour’s **edge** lines only: `slaBreached` / `slaRecovered` (window vs `targetPpm`), `paygSettled`, `weeklyCreditCharged`, `serverSaturated` (utilization ≥ 100), `cashLow` (cash crossing ≤ 0). Construct starts with `events: []`. Event `hourIndex` is the hour just simulated (before the increment).

`new Game(initial, { random?: RandomSource })`. Default wraps `Math.random`. Demand code calls `random.nextUnit()` only.

Opening Shift lasts `OPENING_SHIFT_HOURS` (336 = 14×24) in `src/catalog/opening-shift-policy.ts`. `openingShiftOutcome(snapshot)` is **in_progress** until `hourIndex >= 336`. After that it is **won** only if cash `> 0`, `jailed` is false, at least two **served** projects have `windowAvailabilityPpm >= targetPpm`, and no settlement landed in the catastrophe credit band (`slaCreditPpm(settlement.periodPpm, targetPpm) === SLA_CREDIT_CATASTROPHE_PPM`). Otherwise **lost** (failed reasons: `jailed` / `cash` / `contracts` / `catastrophe`). Pure helper — do not tick 336 hours in tests.

The catastrophe check reads the **credit band, not revenue**. A period spent entirely `offline` bills nothing, so a revenue test (`creditCents === periodRevenueCents && periodRevenueCents > 0`) could never fire on it and parking a failing contract for a whole period would dodge the loss for free. Rating the band instead treats a fully parked period as the total outage it is.

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

A `served` `ProjectInitial` requires a `route`, and a non-served one must not carry one — construct throws either way. `Game` additionally throws when a route names an id absent from `assets`, and re-checks that on every `dispatch`. The check (`assertRoutesResolve` in `game.utils.ts`) runs against the **candidate** graph returned by `applyCommand`, before any field is written, so a rejected command leaves the game exactly as it was instead of half applied.

After `tick()`, `game.metrics` (`src/game.metrics.ts`), each `server.metrics` (`src/server.metrics.ts`), and each `project.metrics` (`src/project.metrics.ts`) hold that hour’s snapshot. `game.finance` (`src/game.finance.ts`) is the last-hour money snapshot: `cashCents`, `accountsReceivableCents`, `jailed`, fleet totals `opexCents` / `maintenanceCents` / `powerCents` / `leaseCents`.

## SLA measurement

After `server.tick`, `applyProjectSla` (`src/game.sla.ts`) attributes each project’s **handled** vs misses. Unroutable leftover is a miss. Capacity drops on a box split in proportion to that project’s `requests` on the box (floor + remainder). Conservation: `handled + unroutable + capacityDrop = emitted`. Game `handledRequests` / `droppedRequests` / `errorPpm` stay physics (N1); they are not the SLA scalar.

This-hour `availabilityPpm = floor(handled * 1_000_000 / emitted)` when `emitted > 0`, else `null`. Each `Project` keeps a ring of `{ handled, emitted }` up to `SLA_WINDOW_HOURS` (168 in `src/catalog/sla-policy.ts`). Emit-0 hours (offered / declined / zero demand) are **not** appended; **offline** hours are — a parked project emits, handles 0, and the whole hour lands in the ring as a miss. `windowAvailabilityPpm` is the same floor over ring sums; `null` if `sumEmitted === 0`. Partial windows are valid. The ring has no target %; credits use **period** buckets at week close (Z2), not `windowAvailabilityPpm`. `slaRecoveryHours(samples, targetPpm)` (`src/catalog/sla-policy.ts`) simulates appending 100% hours on that ring (FIFO 168) and returns hours until window ≥ target, or `null` if already meeting, empty, or unreachable in one window. It does not mutate the ring.

## Wallet and opex

Money tunables live in `src/catalog/economy-policy.ts` (not `SERVER_CATALOG`). Each SKU has integer `leaseHourlyCents` (Bronze **147**) besides purchase and maint/power. Teaching break-even is about one billing week of idle opex: `(purchase − salvage) / (leaseHourly − maint − idlePower) ≈ 168`. Salvage is `floor(purchaseCents * SALVAGE_PERCENT / 100)` (`SALVAGE_PERCENT = 70`) from the **owned tenure’s** `purchaseCents`, not a live catalog lookup. Bigger SKUs pay **more** maintenance in absolute cents; maintenance per compute unit still falls; power still scales up with size; `thin-ram` is a high-maint trap. Jail is sticky: `cashCents <= -DEBT_LIMIT_CENTS` (20_000) sets `jailed`; this slice never clears it. Negative cash is allowed; buy still requires `cashCents >= purchaseCents`. Lease acquire costs **0** cash.

Opex runs **after** `server.tick` / `measureGameTick`, **before** `hourIndex += 1`. Per box, using this hour’s `server.metrics.utilization` (tightest axis; 0 when `assignedRequests === 0`; may exceed 100):

```
utilForPower = min(utilization, 100)
powerCents   = idle + floor((max - idle) * utilForPower / 100)
leaseCents   = tenure.kind === "leased" ? tenure.hourlyCents : 0
opexCents    = maintenance + powerCents + leaseCents
```

`skuHourlyOpex` is still maint+power only. `measureGameOpex` adds rent. Idle owned boxes still pay maintenance + idle power; leased boxes pay that **plus** rent. Overload bills **max** power, not above TDP. Empty fleet opex is 0. Then `cashCents -= totalOpex`. Served PAYG is added to `accountsReceivableCents`, not cash. Jail trips after the opex cash move (receivable does not delay jail).

## Billing (PAYG)

Commercial tunables live in `src/catalog/commercial-policy.ts`. Every project must have `commercial: { paygCentsPerThousandHandled, recurringCentsPerPeriod, targetPpm, creditPpm }`. PAYG and recurring ≥ 0 integers; at least one > 0; `targetPpm` / `creditPpm` finite integers. Construct throws otherwise. `acceptProject` copies `commercial` onto `accepted` (`asAccepted`) and posts `recurringCentsPerPeriod` once via `postCashDelta`. It does not invent a catalog card and does not set a route. `startProject` copies the same terms onto `served` (`asStarted`) and sets `billingOriginHour`. Player–customer MSA (multipliers) is a **different** contract noun later — not fields on `Project`.

Opening cards come from `commercialTermsForCategory` (portfolio 330 / saas 450 / shopping 650 cents per thousand handled; recurring 800 / 1_500 / 2_500; target 990_000; credit 1_000_000). `OPENING_COMMERCIAL_STUB` is the saas card. Overload fixtures use `PAYG_ONLY_COMMERCIAL_STUB` (1000 cents per thousand so PAYG equals handled count). Opening `acme-web` target is **995_000**; `initech-tps` is **980_000**.

After opex, served projects accrue `paygCentsForHandled(handled, paygCentsPerThousandHandled)` into **period buckets** and `game.accountsReceivableCents` (`Project.accruePeriodPayg()`, helper of the same name in `game.commercial.ts`). Emit-0: no PAYG and no period handled/emitted; still increment `hoursServedInPeriod`. **Offline**: no PAYG and **no** `hoursServedInPeriod` bump (recurring sleeps), but `periodHandled` / `periodEmitted` still grow, so the period SLA and any credit see the downtime. Offered/declined: no PAYG. Jailed games still accrue receivable.

After `hourIndex += 1`, if `hourIndex % PAYG_SETTLE_HOURS === 0` (24), `cashCents += accountsReceivableCents` and receivable resets to 0.

When `(hourIndex - billingOriginHour) % BILLING_PERIOD_HOURS === 0` (168 hours after activation), close each project with an origin and `hoursServedInPeriod > 0 || periodEmitted > 0` — a fully parked week still settles (recurring prorates to 0) and its period buckets reset instead of leaking misses into the next period. `accepted` / offered / declined / expired / withdrawn skip. `prepaidAdvance` (posted at accept) returns **−credit only** so week close does not charge the weekly fee a second time:

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

`periodRevenue = periodPaygCents + recurring`. Cash += (`prepaidAdvance` ? −credit : recurring − credit). Push a settlement (`periodIndex = (hourIndex - origin) / 168`); keep `SETTLEMENT_HISTORY_K` (8). Reset period buckets. Jail still closes.

## `dispatch`

`dispatch(command)` mutates the graph immediately. It does **not** call `tick()`, does not update metrics, and does not advance `hourIndex`. Unknown `type` throws.

```ts
type EngineCommand =
  | { type: "acceptProject"; payload: { projectId: string } }
  | { type: "declineProject"; payload: { projectId: string } }
  | { type: "startProject"; payload: { projectId: string; serverId: string } }
  | { type: "cancelSetup"; payload: { projectId: string } }
  | { type: "moveProject"; payload: { projectId: string; serverId: string } }
  | { type: "unassignProject"; payload: { projectId: string } }
  | { type: "assignProject"; payload: { projectId: string; serverId: string } }
  | { type: "buyServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
  | { type: "leaseServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
  | { type: "sellServer"; payload: { serverId: string } }
  | { type: "releaseServer"; payload: { serverId: string } }
  | { type: "enqueueOperationalTask"; payload: { projectId: string; taskId: string } }
  | { type: "cancelOperationalTask"; payload: { taskId: string } }
  | { type: "placeSetup"; payload: { projectId: string; serverId: string } }
  | { type: "installService"; payload: { projectId: string; serviceId: string } }
  | { type: "configureConnection"; payload: { projectId: string } }
  | { type: "powerOn"; payload: { serverId: string } }
  | { type: "powerOff"; payload: { serverId: string } }
  | { type: "duplicateProject"; payload: { projectId: string; destinationServerId: string } };
```

Learning enroll/pause/resume/cancel remain on the same union (see Learning below).

| Command | Transition |
|---------|------------|
| `acceptProject` | `offered` → `accepted`, no route; posts advance once (`recurringCentsPerPeriod` via `postCashDelta`) |
| `declineProject` | `offered` → `declined` |
| `startProject` | `accepted` + `ready` → `served` on `serverId`; sets `billingOriginHour` |
| `cancelSetup` | `accepted` → `withdrawn`; refunds `advancePostedCents` via `postCashDelta` |
| `moveProject` | `served` → `served` on another box |
| `unassignProject` | `served` → `offline`, clearing the route (park). Throws `cannot park during setup` on `accepted` |
| `assignProject` | `offline` → `served` on `serverId` |
| `enqueueOperationalTask` | accepted project; one ops slot; commands enqueue only |
| `cancelOperationalTask` | active ops task → cancelled; progress retained |
| `placeSetup` | accepted project stores `setupServerId` without a live route |
| `installService` | enqueue Application Runtime or Relational Database install (requires placement) |
| `configureConnection` | enqueue the one shared connection task |
| `powerOn` / `powerOff` | immediate; off drops volatile ops progress and live slices, keeps completed installs |
| `duplicateProject` | copies **this** served project only onto a compatible destination; copy is `accepted` with `pendingTransfer`; source stays served |

Unknown project id or wrong source status throws. `startProject` throws when `ready` is false or `pendingTransfer` is set. Completing ops work never calls `startProject`. Cash-changing commands are `acceptProject` (credit advance), `cancelSetup` (debit refund), `buyServer` (debit purchase), and `sellServer` (credit salvage). `leaseServer` and `releaseServer` do not change cash. Any command carrying a `serverId` throws `unknown server id` when the box is absent.

`acceptProject`, `startProject`, `buyServer`, `leaseServer`, `enqueueOperationalTask`, `placeSetup`, `installService`, and `configureConnection` throw while `jailed`; `cancelSetup` / `cancelOperationalTask` / `powerOn` / `powerOff` / `moveProject` / `unassignProject` / `assignProject` / `sellServer` / `releaseServer` / `declineProject` are allowed while jailed.

After the increment, `Project.tickCalendar` expires offered cards with `offerTtlHours > 0` at TTL (48h); other offered fixtures use `0` and never expire. After the 24h allowance, patience is millihours (`setupPatienceMilliHours`; acquaintance trust 70 / reputation 0 / hatred 0 → 14.4h). Withdrawal on the first outer tick at or after that threshold (accept-at-0 → hour 39) refunds the advance (`postCashDelta`) and applies reputation −3 on Game (clamped 0–100). `src/setup-clock.ts` only spawns the next acquaintance when pending cap and interval allow.

`buyServer` throws if `jailed` or `cashCents < purchaseCents` (no debit). Else debit catalog purchase and add an **owned** box (`purchaseCents` from the SKU table).

`leaseServer` throws if `jailed`. Else add a **leased** box at catalog `leaseHourlyCents` with no cash debit. Same SKU + region as buy; same `nextAssetId`.

`sellServer` is **owned only** (`server is leased: ${id}` otherwise). Credits salvage from tenure `purchaseCents` and removes the box.

`releaseServer` is **leased only** (`server is owned: ${id}` otherwise). Removes the box with **no salvage**.

Both sell and release throw while a **served** project routes to that box; a **parked** project does not pin its old box, so park-then-sell / park-then-release works.

Implementation: `applyCommand` in `src/game.utils.ts`.

## Authored catalog check

`src/baseline/` loads [baseline.json](../../docs/product/balance/baseline.json) and fails tests if IDs collide, the technology DAG cycles, a project mix does not sum to 1, a policy guard is violated, or a version-one entry depends on expansion. It is **not** live Game configuration. `Game` must not import it. Technology DAG edges and project `technologies` use catalog **names**; mix keys and finite-job `demand` use demand-type **ids**.

## Work fixtures

`src/work/` is independent share/conservation math for later allocation. It does not run inside `Server.tick`. Throughput dimensions (`cpuWork`, `gpuWork`, `diskOps`, `networkMiB`) are per tick; occupancy (`residentMemoryMiB`, `queuedMemoryMiB`, `diskCapacityMiB`) is retained. GPU work on a host with `gpuCount === 0` is infeasible, not CPU. Contended capacity uses demand-proportional shares (including backlog) with largest-remainder integers and FIFO within a project share.

Root graphs (`evaluateRootOutcomes`, `estimateRootLatency`) count each customer root once. Required-child failure blocks the root; optional children (shop receipt email) do not. Parallel required branches join by max wait+processing; estimates are not a millisecond clock. `Game` must not import this tree.

Ownership, tick order, and same-hour event order stay in product docs and the [milestone](../../docs/milestones/engine-architecture-and-mathematics.md). Do not encode those guidelines as engine modules.

Live tunables stay in `src/catalog/` TypeScript (`kernel.ts` Bronze–Diamond plus `thin-ram`, economy/traffic/SLA policies). [baseline.json](../../docs/product/balance/baseline.json) is checked by `src/baseline/` only. Do not add a catalog compiler or a second JSON that Game loads. Cutover later replaces the live modules (or a versioned runtime snapshot) in place.

## Demand engine

`src/demand-engine/` generates typed root batches for a project. It does not place work, run `Server.tick`, or replace Opening Shift RPS (`ConstantDemand` / `ProjectDemand`). `Game` must not import this tree yet.

Live numbers live in `src/catalog/demand-types.ts`, `demand-rhythms.ts`, `demand-variation.ts`, and `demand-projects.ts` (micro-units: `Math.round(value * 1_000_000)`). `baseline.json` is not loaded. Mixes are permille summing to 1000. Combined campaign × spike is capped at 6. Version-one templates are the default; expansion ids throw unless `allowExpansion` is set.

Hourly arrival: `m = baseline × rhythm × campaign × spike`, then Gamma–Poisson (`k` from early/standard/volatile) and a multinomial split. `constant: true` skips the mixture and uses largest remainder. Finite jobs emit one frozen root from `activateFinite` and never hourly Poisson. Each project uses `SeededRandomSource` from its id. Arrival sample checks state `n` and tolerances in the assertion. Do not re-export this tree from `src/index.ts` until a consumer needs it (barrel imports would load it into Hub/Lab coverage).

## Work queues

`src/demand-engine/queue.ts` keeps arrival cohorts (`demand type` + arrival hour). Waiting age and job `completedCount` survive aggregation. Interactive/continuous expire after the arrival tick; queued work may remain for two further ticks; jobs do not expire here. Occupancy is `queueKiB` × count. Durable job working memory is tracked separately. A full queue rejects new batches and does not evict accepted work. `toExecutionInput()` is for M5; `Game` must not import this tree. There is no resource solver.

## Learning

`src/learning/board.ts` is two shared slots, monthly tuition on `Game.cashCents` via `postCashDelta` (same helper as buy/sell). Base techs start completed. Research does not stack; courses are sequential through five levels. `enrollLearning` / `pauseLearning` / `resumeLearning` / `cancelLearning` are `dispatch` commands. Enroll is blocked while jailed. Progress ticks after opex. Completion at a renewal boundary does not charge again. Effects are stored (completed ids / course levels). Deployment Automation levels shorten operational-queue durations; installs are still not applied to instances. Incident/CPU consumers remain missing. Research is not installation.

`learningCatalog` / `Game.learningCatalog` projects locked, available, insufficient-funds, active, paused, and completed rows. Completed course levels are a different projection from the active next-level enrollment. DemandEngine is still not imported by `Game`; Lab may import `@packages/fivenines-engine/demand-engine` (engine entry only — do not barrel `queue.ts` into Hub/Lab coverage).

## Operational queue

`src/operations/queue.ts` is one player slot (`OPERATIONAL_SLOT_COUNT`), analogous to `LearningBoard`. `#tickOperations` on the playlist advances active work by 1000 millihours per outer hour. First-project checklist ids (`install-application-runtime` 2h, `install-relational-database` 2h, `configure-shared-connection` 1h) live in `src/catalog/operations-policy.ts`. Shared configuration requires both installs complete. Cancel keeps completed millihours; re-enqueue resumes them. Duration uses stored `deployment-automation` course levels (0.92/level via catalog cumulative micro). When all three ids are `completed` for that project, `Project.withReady()` runs; status stays `accepted`. `installService` / `configureConnection` enqueue those ids. Completing them stamps `installedServiceIds` and `connectionConfigured` on the project. `Game` still does not import `src/topology/`. `placeSetup` assigns a box during setup without serving. `powerOn` is immediate. `powerOff` zeros active millihours (volatile) and live slices; completed installs stay.

## Identity registry

`src/identity/registry.ts` indexes `customer` | `project` | `asset` | `service` | `instance` by globally unique id and owner. `registerAll` is atomic. `assertHourIndex` accepts non-negative integers. `Game` must not import this tree yet.

## Topology graph

`src/topology/graph.ts` holds project services, deployment instances, shared assets, dependency edges, and placement. Mutations are atomic and rebuild instance-by-asset indexes. Live `Game` still routes one `RouteTarget` and must not import this tree.

## Related

- Intended behavior: [Product reference](../../docs/product/index.md)
- M1 (in review on #98): [engine architecture and mathematics](../../.cursor/plans/m1-engine-architecture-and-mathematics.plan.md)
- M2 (in review on #101): [entities and catalogs](../../.cursor/plans/m2-entities-and-catalogs.plan.md)
- M3 (in review on #104): [demand, work retention and learning](../../.cursor/plans/m3-demand-and-learning-foundations.plan.md)
- M4 (stacks on #104): [infrastructure preparation and operations](../../.cursor/plans/m4-infrastructure-preparation-and-operations.plan.md) — #71–#74 folded into #111. [#75](https://github.com/movahedan/fivenines/issues/75) is workspace operations.
- Authored tuning: [Balance baseline](../../docs/product/balance/index.md)
- Current behavior remains defined by this guide, source, and tests. Retired engine/hosting plans were deleted after product consolidation; the product reference does not imply that its future behavior is already implemented.

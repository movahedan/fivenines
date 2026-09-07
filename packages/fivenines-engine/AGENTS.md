# AGENTS.md

**@packages/fivenines-engine** — pure simulation kernel (OO `Game` graph). Workspace `name` is **`@packages/fivenines-engine`** (singular `@package`). Path: `packages/fivenines-engine`.

`@apps/web` `/lab` constructs `Game` on the client (Opening Shift). Nest is the future production caller.

## Commands

```bash
bun test packages/fivenines-engine
bun run turbo run typecheck --filter=@packages/fivenines-engine
bun run turbo run test --filter=@packages/fivenines-engine
```

Package scripts: `typecheck` (`tsc --noEmit`), `test` (re-roots to repo `bun test`).

## Graph

`Game` owns `customers[]` and `assets[]` (`Server` only). No load balancers, project routes, or balancer pools.

| Noun | Role |
|------|------|
| `Customer` | Org with `projects[]`. Does not emit load. |
| `Project` | `offered` \| `declined` \| `served`. Served demand is integer RPS from a `DemandModel`. |
| `Server` | Inventory. Empty fleet: served demand is unroutable drops. Each box has a `region` (same enum as projects). |

Ids are unique per game (`customer.id`, `project.id` global, `asset.id`) via `@packages/shared/ids`. Construct throws on duplicates.

Tick walks each served project: `placeProjectDemand` fills **local** boxes first (`server.region === project.region`), then **other-region** overflow, then leftover is **unroutable** `droppedRequests`. Slices are `{ category, requests, sourceRegion, remote }`. Split among a pool uses `computeUnitsPerHour` (floor + remainder) capped by remaining compute headroom. Extra p95 on a box is `|offsetHours| × PLACEMENT_POLICY.latencyMsPerOffsetHour` (v1: `5` in `src/catalog/placement-policy.ts`), mixed by slice request counts (`regions.remoteLatencyMs`).

On each box, `server.tick` converts slices via `CAPACITY_POLICY` (`src/catalog/capacity-policy.ts`): v1 `cpuPerRequest = 1` for all categories; shopping/saas/portfolio differ on `bytesPerRequest` (40/10/20) and `memPerInflight` (2/4/1). `cpuLoad` / `netLoad` are per assigned request this hour. `inFlight = floor(assigned × inflightPerThousandRequests / 1000)` (v1: 10). `memOcc = baseMemoryMiB + inFlight ×` request-weighted `memPerInflight`. Handled scales by the **min** finite cap/load ratio (floor) across CPU/net/RAM; leftover on that box is dropped. Utilization is the **tightest** axis.

Catalog: Bronze–Diamond plus teaching `thin-ram` (`SERVER_CATALOG`). Bronze = compute **1000**, net **1_000_000**, memory **4096**, base **256**. Overload fixtures `oneBronzeInitial` / `twoBronzeInitial`: two **constant** served projects at 700+700 (exact **1400**, CPU-bound on one Bronze). `openingInitial`: 4 customers, 10 **shaped** offered projects, `assets: []`.

Runtime: `@packages/shared/units`, `@packages/shared/ids`. Integers only at the demand boundary. `1 tick() = 1` simulated hour.

## Clock and RNG

`hourIndex` starts at `0`. Each `tick()` uses the **current** hour for demand, rolls physics metrics, charges opex, may trip jail, then `hourIndex += 1`. Derived: `hourOfDay = hourIndex % 24`, `dayIndex = floor(hourIndex / 24)`. `dispatch` does not change the clock and does not charge hourly opex.

`new Game(initial, { random?: RandomSource })`. Default wraps `Math.random`. Demand code calls `random.nextUnit()` only.

## Project demand

`estimatedRequestsPerHour` is the **baseline**. `demand: "constant"` returns that baseline when served (overload proofs). `demand: "shaped"` uses category rhythm + timezone + optional campaign window + spikes + jitter from `src/catalog/traffic-policy.ts`. Offered / declined return `0` and must not consume RNG.

`ProjectInitial` also requires `category` (`shopping` \| `saas` \| `portfolio`), `region` (`REGION_IDS` in `src/catalog/regions.ts`; unknown id throws), `campaignProne`, optional `campaign: { startHour, durationHours }` (`durationHours >= 1`). Shaped demand uses `regions.offsetHoursFor(region)` for `localHour`. Lab buy default is `DEFAULT_REGION` (`utc+0`).

## Constructor

```ts
import { Game, oneBronzeInitial, twoBronzeInitial } from "@packages/fivenines-engine";

const overloaded = new Game(oneBronzeInitial).tick();
const healthy = new Game(twoBronzeInitial).tick();
```

`GameInitial`: `{ customers, assets, cashCents?, jailed? }`. Empty `assets` is valid. Defaults: `cashCents = STARTING_CASH_CENTS` (40_000), `jailed = false` (`src/catalog/economy-policy.ts`). Cash is signed integer cents.

After `tick()`, `game.metrics` (`src/game.metrics.ts`), each `server.metrics` (`src/server.metrics.ts`), and each `project.metrics` (`src/project.metrics.ts`) hold that hour’s physics snapshot. `game.finance` (`src/game.finance.ts`) is the last-hour money snapshot: `cashCents`, `jailed`, fleet totals `opexCents` / `maintenanceCents` / `powerCents`.

## Wallet and opex

Money tunables live in `src/catalog/economy-policy.ts` (not `SERVER_CATALOG`). Salvage is `floor(purchaseCents * SALVAGE_PERCENT / 100)` (`SALVAGE_PERCENT = 70`). Better SKUs pay **less** maintenance per hour; power still scales up with size; `thin-ram` is a high-maint trap. Jail is sticky: `cashCents <= -DEBT_LIMIT_CENTS` (20_000) sets `jailed`; this slice never clears it. Negative cash is allowed; buy still requires `cashCents >= purchaseCents`.

Opex runs **after** `server.tick` / `measureGameTick`, **before** `hourIndex += 1`. Per box, using this hour’s `server.metrics.utilization` (tightest axis; 0 when `assignedRequests === 0`; may exceed 100):

```
utilForPower = min(utilization, 100)
powerCents   = idle + floor((max - idle) * utilForPower / 100)
opexCents    = maintenance + powerCents
```

Idle boxes still pay maintenance + idle power. Overload bills **max** power, not above TDP. Empty fleet opex is 0. Then `cashCents -= totalOpex`; if at/under the debt limit, `jailed = true`.

## `dispatch`

`dispatch(command)` mutates the graph immediately. It does **not** call `tick()`, does not update metrics, and does not advance `hourIndex`. Unknown `type` throws.

```ts
type EngineCommand =
  | { type: "acceptProject"; payload: { projectId: string } }
  | { type: "buyServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
  | { type: "sellServer"; payload: { serverId: string } };
```

`acceptProject` requires `status === "offered"`. Throws if `jailed`. No cash change.

`buyServer` throws if `jailed` or `cashCents < purchaseCents` (no debit). Else debit catalog purchase and add the box.

`sellServer` is allowed while jailed. Credits salvage and removes the box.

Implementation: `applyCommand` in `src/game.utils.ts`.

## Related

- Opex / cash: `.cursor/plans/fivenines-engine-opex.plan.md` — spec `.cursor/plans/fivenines-engine-opex.design.md`
- Plan: `.cursor/plans/fivenines-engine-capacity.plan.md` (region / placement; traffic: `.cursor/plans/fivenines-engine-traffic.plan.md`)
- Spec: `.cursor/plans/fivenines-engine-capacity.design.md`
- Domain (kernel graph): `.cursor/plans/fivenines-engine-domain.design.md`

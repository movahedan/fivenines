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

Tick walks each served project: `placeProjectDemand` fills **local** boxes first (`server.region === project.region`), then **other-region** overflow, then leftover is **unroutable** `droppedRequests`. Slices are `{ category, requests, sourceRegion, remote }`. Split among a pool uses `cpuMillicores` (floor + remainder) capped by remaining `requestCapacity`. Extra p95 on a box is `|offsetHours| × PLACEMENT_POLICY.latencyMsPerOffsetHour` (v1: `5` in `src/catalog/placement-policy.ts`), mixed by slice request counts (`regions.remoteLatencyMs`).

Catalog: Bronze–Diamond (`SERVER_CATALOG`; Bronze = 1000 millicores, 1 millicore/request). Overload fixtures `oneBronzeInitial` / `twoBronzeInitial`: two **constant** served projects at 700+700 (exact **1400**). `openingInitial`: 4 customers, 10 **shaped** offered projects, `assets: []`.

Runtime: `@packages/shared/units`, `@packages/shared/ids`. Integers only at the demand boundary. `1 tick() = 1` simulated hour.

## Clock and RNG

`hourIndex` starts at `0`. Each `tick()` uses the **current** hour for demand, rolls metrics, then `hourIndex += 1`. Derived: `hourOfDay = hourIndex % 24`, `dayIndex = floor(hourIndex / 24)`. `dispatch` does not change the clock.

`new Game(initial, { random?: RandomSource })`. Default wraps `Math.random`. Demand code calls `random.nextUnit()` only.

## Project demand

`estimatedRequestsPerHour` is the **baseline**. `demand: "constant"` returns that baseline when served (overload proofs). `demand: "shaped"` uses category rhythm + timezone + optional campaign window + spikes + jitter from `src/catalog/traffic-policy.ts`. Offered / declined return `0` and must not consume RNG.

`ProjectInitial` also requires `category` (`shopping` \| `saas` \| `portfolio`), `region` (`utc-8` \| `utc-5` \| `utc+0` \| `utc+1` \| `utc+9`; unknown id throws), `campaignProne`, optional `campaign: { startHour, durationHours }` (`durationHours >= 1`). Shaped demand uses `regions.offsetHoursFor(region)` for `localHour` (`src/catalog/regions.ts`).

## Constructor

```ts
import { Game, oneBronzeInitial, twoBronzeInitial } from "@packages/fivenines-engine";

const overloaded = new Game(oneBronzeInitial).tick();
const healthy = new Game(twoBronzeInitial).tick();
```

`GameInitial`: `{ customers, assets }`. Empty `assets` is valid.

After `tick()`, `game.metrics`: `handledRequests`, `droppedRequests`, `p95LatencyMs`, `utilization`, `errorPpm`.

## `dispatch`

`dispatch(command)` mutates the graph immediately. It does **not** call `tick()`, does not update metrics, and does not advance `hourIndex`. Unknown `type` throws.

```ts
type EngineCommand =
  | { type: "acceptProject"; payload: { projectId: string } }
  | { type: "buyServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
  | { type: "sellServer"; payload: { serverId: string } };
```

`acceptProject` requires `status === "offered"`. Implementation: `applyCommand` in `src/game.utils.ts`.

## Related

- Plan: `.cursor/plans/fivenines-engine-capacity.plan.md` (region / placement; traffic: `.cursor/plans/fivenines-engine-traffic.plan.md`)
- Spec: `.cursor/plans/fivenines-engine-capacity.design.md`
- Domain (kernel graph): `.cursor/plans/fivenines-engine-domain.design.md`

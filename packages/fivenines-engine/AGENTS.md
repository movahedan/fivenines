# AGENTS.md

**@packages/fivenines-engine** — pure simulation kernel (OO `Game` graph). Workspace `name` is **`@packages/fivenines-engine`** (singular `@package`). Path: `packages/fivenines-engine`.

Do **not** import this package from `@apps/web`. Nest is the future production caller; nothing in `apps/` depends on it yet.

## Commands

```bash
bun test packages/fivenines-engine
bun run turbo run typecheck --filter=@packages/fivenines-engine
bun run turbo run test --filter=@packages/fivenines-engine
```

Package scripts: `typecheck` (`tsc --noEmit`), `test` (re-roots to repo `bun test`).

## Graph

`Game` owns `customers[]`, `assets[]` (`Server` | `LoadBalancer`), `projectRoutes`, and `balancerPools`.

| Noun | Role |
|------|------|
| `Customer` | Org with `projects[]`. Does not emit load. |
| `Project` | `offered` \| `declined` \| `served`. Emits `estimatedRequestsPerHour` only when `served`. |
| `Server` / `LoadBalancer` | Inventory. LB is an asset, not a field on `Game`. |
| Routes / pools | Project → LB (missing ⇒ default pool). LB → servers. Default pool = servers not in any pool. |

Ids are unique per game (`customer.id`, `project.id` global, `asset.id`). Construct and `dispatch` throw on unknown attachment ids, duplicate project routes, or a server on two LBs. Unroutable served demand counts as dropped.

Catalog: `TINY` (1000 millicores, 1 millicore/request). Fixtures `oneTinyInitial` / `twoTinyInitial` use two served projects at 700+700 and no LB.

Runtime dep: `@packages/shared/units` only. Integers only. 1 `tick()` = 1 simulated hour.

## Constructor

```ts
import { Game, oneTinyInitial, twoTinyInitial } from "@packages/fivenines-engine";

const overloaded = new Game(oneTinyInitial).tick();
const healthy = new Game(twoTinyInitial).tick();
```

`GameInitial`: `{ customers, assets, projectRoutes, balancerPools }`. Empty routes/pools is valid.

After `tick()`, `game.metrics`: `handledRequests`, `droppedRequests`, `p95LatencyMs`, `utilization`, `errorPpm`.

## `dispatch`

`dispatch(command)` mutates the graph immediately. It does **not** call `tick()` and does not update metrics. Unknown `type` throws.

```ts
type EngineCommand =
  | { type: "acceptProject"; payload: { projectId: string } }
  | { type: "buyServer"; payload: { serverType: "tiny" } }
  | { type: "buyLoadBalancer" }
  | { type: "attachProject"; payload: { projectId: string; loadBalancerId: string } }
  | { type: "attachServer"; payload: { loadBalancerId: string; serverId: string } };
```

`acceptProject` requires `status === "offered"`. Implementation: `applyCommand` in `src/game.utils.ts` (returns a new graph; `Game.dispatch` applies it).

## Related

- Plan: `.cursor/plans/fivenines-engine-kernel.plan.md`
- Spec: `.cursor/plans/fivenines-engine-domain.design.md`

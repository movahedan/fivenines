# Five Nines engine domain (Game / customers / assets)

Approved chat model (2026-09-05). This spec replaces the Phase 1 kernel graph (`Game.customer`, `Game.loadBalancer`, `ProductFeature`). It does **not** implement RNG, cash, SLA, Nest, or UI.

Package stays `@packages/fivenines-engine`. `Game.tick()` remains the only hour hand. Integers only. 1 tick = 1 simulated hour.

---

## Outcome

A constructed `Game` can:

- Hold many `Customer`s, each with many `Project`s
- Treat a project as `offered` | `declined` | `served`
- Emit traffic only for **served** projects (estimate from construction)
- Own a fleet of typed assets (`Server`, `LoadBalancer`) — LB is not a field on `Game`
- Route demand through **attachments** (project → LB or default pool; LB → servers)
- Still prove: one Tiny + two served projects drops; two Tiny drops zero and has lower p95

The player is the human running the campaign. `Game` is that run. There is no `Player` entity in the tick graph.

---

## Nouns

| Noun | Owner | Role |
|------|--------|------|
| `Game` | — | Campaign. Owns `customers`, `assets`, `attachments`. `tick()` / later `dispatch()`. |
| `Customer` | `Game` | Org that owns projects. Does not emit load. |
| `Project` | `Customer` | Offered / declined / served work. Holds `estimatedRequestsPerHour`. Emits that amount **only when served**. |
| `Server` | `Game.assets` | Capacity. Consumes an assigned request slice. |
| `LoadBalancer` | `Game.assets` | Routing asset. Splits demand onto attached servers, proportional to CPU cap. |
| `Attachment` | `Game` | Binding only. Not an asset. |

No `ProductFeature` until a served project actually splits into deployable slices. Traffic is project-level.

---

## Project lifecycle

| Status | In tick demand? | How it appears in this spec |
|--------|-----------------|-----------------------------|
| `offered` | No | Constructor (RNG offers are later) |
| `declined` | No | Constructor or later `dispatch` |
| `served` | Yes: `estimatedRequestsPerHour` | Constructor or later accept command |

Accept/decline does not advance time. Only `tick()` does.

A project may carry a non-zero estimate while `offered`. The number is ignored until `served`.

---

## Routing

**Project route** (optional): `projectId` → `loadBalancerId`.  
Missing route ⇒ **default pool**.

**Balancer pool:** `loadBalancerId` → one or more `serverId`s.  
Split: floor by CPU cap, remainder +1 from the start of the list (same as current kernel).

**Default pool:** every `Server` that is **not** in any balancer pool. This is a policy, not an asset. No LB in the fixture ⇒ every server is in the default pool.

**Unroutable served demand is dropped** (counts in `droppedRequests`):

- Served project routed to an LB with zero attached servers
- Served project on the default pool when that pool is empty
- Served demand with zero servers in the game

Unknown `projectId` / `loadBalancerId` / `serverId` on an attachment **throws** at construct (or at `dispatch` later). Duplicate project route throws. Same server on two LBs throws (v1: a server has at most one balancer).

---

## Tick order

1. Sum `estimatedRequestsPerHour` from every **served** project (walk `Game.customers → projects`).
2. Group that demand by route (per LB, plus default pool).
3. Each LB assigns slices to its servers; default pool assigns to unpooled servers.
4. Every `Server.tick()` computes handled / dropped / utilization / latency / error ppm.
5. `Game` rolls up last-tick metrics.

Servers do not discover peers. LBs do not live on `Game` as a singleton.

Public metrics (unchanged names): `handledRequests`, `droppedRequests`, `p95LatencyMs`, `utilization`, `errorPpm`.

---

## Constructor shape (plain POJOs)

```ts
type ProjectStatus = "offered" | "declined" | "served";

interface ProjectInitial {
  id: string;
  estimatedRequestsPerHour: number; // finite non-negative integer
  status: ProjectStatus;
}

interface CustomerInitial {
  id: string;
  projects: readonly ProjectInitial[];
}

type AssetInitial =
  | { kind: "server"; id: string; catalogId: "tiny" }
  | { kind: "loadBalancer"; id: string };

interface GameInitial {
  customers: readonly CustomerInitial[];
  assets: readonly AssetInitial[];
  projectRoutes: readonly { projectId: string; loadBalancerId: string }[];
  balancerPools: readonly { loadBalancerId: string; serverId: string }[];
}
```

Empty `projectRoutes` / `balancerPools` is valid (default pool).

Ids are unique inside one `Game`: `customer.id`, `project.id` (global, not per customer), `asset.id`. Duplicate ids throw at construct.

A route on an `offered` or `declined` project is stored and idle. It does not move demand until that project is `served`.

Catalog stays in-package: `TINY` (1000 millicores, 1 millicore/request) plus fixture estimates **700 + 700** so one Tiny is over cap and two Tiny are under.

---

## Overload fixtures

Two **served** projects on one customer (or two customers — either is fine). No LB. Default pool.

- `oneTinyInitial`: one Tiny server → `droppedRequests > 0`
- `twoTinyInitial`: two Tiny servers → `droppedRequests === 0` and `p95LatencyMs` lower than one Tiny

Offered/declined projects in the same graph must not change those numbers (demand stays 1400).

---

## Later (not this rewrite)

- `dispatch`: accept/decline offer, buy server, buy LB, attach project↔LB, attach LB↔server
- RNG offer stream
- Cash, SLA, Opening Shift copy
- Pin-project-to-server without an LB
- `ProductFeature`
- Nest / UI / Prisma mapping
- Player entity

Time vs command stays: `dispatch` mutates immediately; `tick()` advances the clock.

---

## What the current kernel must drop

| Current | After |
|---------|--------|
| `Game.customer` (singular) | `Game.customers` |
| `Game.loadBalancer` always-on | LB only if present in `assets` |
| `Game.servers` | servers filtered from `assets` |
| `ProductFeature` / live flag | `Project.status` + `estimatedRequestsPerHour` |
| Feature catalog ids `alpha`/`beta` | project estimates on the fixtures |

Package scaffold (`package.json`, tsconfig, units, integer latency) stays.

---

## Non-goals

Polymorphic `Asset` class with optional CPU/routing fields. Money. RNG. Docs/PR until asked. Wiring `@apps/nestjs` or `@apps/web`.

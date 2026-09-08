# Hosting platform — design

**Date:** 2026-09-08  
**Plan:** `.cursor/plans/fivenines-hosting-platform.plan.md`  
**Status:** Agreed in product meeting; not implemented.

Five Nines is a small hosting shop becoming a reliable platform. It is not an AWS simulator. Kubernetes, if it appears, is late-game automation — not the goal.

Technology names stay generic (health checks, monitoring, logging, backups, rollback, load balancing, automated recovery, rolling deployments, containers, orchestration). Effects stay causal: monitoring shortens discovery, logging shortens diagnosis, rollback shortens recovery from a bad deploy, backup bounds data-loss, a load balancer keeps traffic on healthy members, SLA feeds credits / reputation / contracts. Research unlocks **permission to use**. It does not apply a profit multiplier.

Keep these nouns separate. Do not dump them into one `technologies[]`.

| Noun | Role |
|------|------|
| Technology | Global knowledge Research unlocks later |
| Server module | Installed on a box (e.g. monitoring agent); uses RAM/OPEX |
| Project policy | Backup schedule, rollback policy (later) |
| Infrastructure asset | Server now; load balancer / storage later |
| Contract requirement | Capability a customer requires or prefers |
| Route | Project → one target |
| Trust / hatred | Per-customer relationship stocks (phase 5) |

CI / GitHub Overall / Copilot review: **do not change**. PR #39 and the required `overall` ruleset stay as they are.

---

## Current kernel (problem)

`Game.tick` walks served projects and `placeProjectDemand` fills the **whole fleet** (same-region pool, then other-region overflow). A served project is not on a server. That makes these questions meaningless: which box is this project on, which projects die if this box dies, where is monitoring installed, what would a balancer sit in front of, can I sell this box.

`acceptProject` payload is `{ projectId }` only (`packages/fivenines-engine/src/game.utils.ts`). Hub accept does not pick a server. `ActiveProjectCard.serverLabel` is currently `"{n} local"` (region pool count), not a box id.

`Project.tick` emits demand only when `status === "served"`. Recurring uses `hoursServedInPeriod`. Emit-0 hours are not appended to the SLA ring.

---

## Identity of routing

A project has **at most one** `RouteTarget`. An array of servers **is** load balancing and is out of scope until a balancer asset exists.

```ts
type RouteTarget = { kind: "server"; serverId: string };

// later
type RouteTarget =
  | { kind: "server"; serverId: string }
  | { kind: "balancer"; balancerId: string };
```

The route lives **on the project**, not a parallel `routes[]`.

| Status | Route |
|--------|--------|
| `offered` / `declined` | none |
| `served` | exactly one server target |
| `offline` | none (explicit park) |

Construct / `asServed` throw if `served` has no valid `serverId` in `assets`.

Cross-region assign/move is **legal**. Capacity is only that box. Extra latency stays the existing region-offset rule (`placement-policy`). Cost, not a lock. No Research gate in phase 1.

Many projects may share one server. They share that box’s CPU/net/RAM via existing `server.tick`. They must not spill onto other boxes.

---

## Phase 1 — commands and tick

`dispatch` still does not tick, charge opex, accrue PAYG, settle, close the week, or rewrite SLA slots.

| Command | From → to | Rules |
|---------|-----------|--------|
| `acceptProject { projectId, serverId }` | offered → served + route | Jailed or unknown/missing server throws. **Breaking** payload. |
| `declineProject` | offered → declined | Unchanged; allowed while jailed |
| `moveProject { projectId, serverId }` | served → served, new route | Instant cutover (no drain). Any region. |
| `unassignProject { projectId }` | served → offline, clear route | Park |
| `assignProject { projectId, serverId }` | offline → served + route | Bring-up only (first pin is accept) |
| `sellServer { serverId }` | — | Throws if any **served** project is routed there. **Offline does not pin** the box; sell is allowed. |
| `buyServer` | — | Unchanged |

Jailed: no accept, no buy. Move / unassign / assign / sell / decline remain allowed.

### Tick and money

- **Served:** demand emits; `placeProjectDemand` (or replacement) places **only** on the routed server. Fleet-wide pool and overflow **removed**. Remote region still adds latency. Leftover on that box is unroutable or capacity-drop as today.
- **Offline:** demand **still emits** (cannot reuse “non-served → 0”). Nothing is placed; all emitted is unroutable. SLA window **and** period handled/emitted count the miss.
- **Recurring pause:** offline hours do **not** increment `hoursServedInPeriod`. PAYG handled is 0. Period SLA **does** include those hours (invoice line sleeps; contract still saw downtime).

Opening Shift empty fleet: accept is impossible until the player owns a server. Win condition still requires ≥2 **served** projects meeting window SLA; parking cannot farm a win.

### UI

- `/hub`: accept requires a server picker (extend offer card and/or hub session; molecules stay engine-agnostic). Active card `serverLabel` is the routed server id (or catalog+id). Served cards: move (picker) and unassign. Collect offline rows (parked) with assign. Sell uses engine throw surfaced as `lastError`.
- `/lab`: same commands; debug harness stays client `Game`.
- No Nest in this phase.

### Fixtures and tests

- `oneBronzeInitial`: both constant 700 RPS projects **served on `server-1`** (keep 1400 Bronze overload proof).
- Isolation fixture: two projects, two Bronzes, **one project per box**; overload on A does not assign slices to B.
- `twoBronzeInitial` today proves fleet pooling — that behavior **goes away**. Rewrite those tests; do not keep a silent pool.
- Every `acceptProject` dispatch in tests must pass `serverId`.

Exit: two projects on two servers; saturating one does not borrow the other. Sell while routed throws. Accept without a valid server throws. One offline hour is fully unroutable and does not increment `hoursServedInPeriod`.

---

## Phase 2 — server tenure

```ts
type ServerTenure =
  | { kind: "owned"; purchaseCents: number }
  | { kind: "leased"; hourlyCents: number };
```

- **Owned:** high purchase, lower hourly OPEX, `sellServer` (salvage). Today’s buy path.
- **Leased:** ~0 purchase, high hourly rent, `releaseServer` (not sell). Same catalog capacity and reliability as owned of that SKU — do not nerf rentals.

Teaching point:  
`breakEvenHours = (purchaseCost - expectedSalvage) / (rentalHourlyCost - ownedHourlyOpex)`  
Short jobs rent; steady load buys.

Lease charge is hourly with opex, integers, catalog policy file. No Research.

---

## Phase 3 — first incident

One incident type: `serverOutage`.

Cycle: server **degraded** → **unavailable** → routed projects lose that capacity → SLA falls. Player **repairs** or **reroutes** (`moveProject` / park + assign).

Monitoring is an **optional server module** from the start (not a Research unlock yet):

- Without: incident becomes visible after a delay or via customer report.
- With: discovery is almost immediate.
- Agent costs a little RAM and OPEX.

Do not add logging, backup, or rollback. One incident cannot teach all four.

---

## Phase 4 — Nest owns session, not physics

Do not move `Game.tick` into Nest. Nest owns lifecycle, persistence, concurrency, transport.

- Versioned `GameSnapshot`: JSON-serializable, includes RNG state, `schemaVersion`, `revision`. Restore test: snapshot + same commands ⇒ same result. Today’s `MathRandomSource` is **not** restorable; phase 4 must introduce a seedable, serializable RNG for production games (`/lab` may keep `Math.random`).
- One aggregate: `GameSession` (`id`, `userId`, `snapshot` JSONB, `revision`, `paused`, `lastTickAt`, timestamps). **Do not** Prisma-model each Server/Project. **Do not** use existing `Tenant` / `Project` / `FeatureFlag` as game truth. Do not delete that control plane in the same PR unless it is already unused — just do not depend on it.
- HTTP: `POST /v1/games`, `GET /v1/games/:id`, `POST .../commands`, `pause`, `resume`, `GET .../events`. After a committed tick, game SSE sends `revision`, `hourIndex`, **full snapshot**, engine events. No delta protocol in MVP.
- Existing clock SSE is wall-clock session health — do not confuse it with the game stream.
- `/hub` stops `new Game()`. `/lab` stays a local debug harness.

---

## Phase 5 — trust and hatred (after incidents exist)

Two independent stocks **per customer**, not per project. UI never says “happy” (you are still the devops). They can hate you and still trust uptime.

Internal: `trustMilli` / `hatredMilli` in `0…10_000` (display 0–100). Engine stays integer. Five bands of 20 for each axis. Trust labels stay professional (unproven → trusted). Hatred labels are the comedy (annoyed → furious).

**No idle trust drip.** Trust moves on events:

| Event | Trust |
|-------|--------|
| Billing cycle with no incidents | +20 (display points; +2000 milli) |
| Incidents this period: low frequency **and** low resolve time | +10 |
| Campaign window with **fewer than 2** incidents | +15 |

While a **mood** is active, that hour applies a **small** trust delta (tune in this phase, not earlier): uncomfortable / frustrated / mad are mutually exclusive for the hour (not stacked). Neutral hours do not drip.

**Hatred** (no hourly cool-off). Rises from: parked (while offline), outage duration, customer noticed before the player (no monitoring), week close with an SLA credit, offer sat too long. Falls only on events: restored from park, clean week, fast repair.

Churn / offer quality from hatred bands can stay a thin hook; full economy of “mad customers leave” may be a follow-up inside this phase’s verify list.

---

## After this initiative (not in the five PRs)

Research tree (Basic Monitoring, Load Balancing, Centralized Logging, Automated Restart, Deployment History, Rollback, Scheduled Backup, Multi-region Routing, Containerization, Orchestration) and matching incident families (bad deploy, data corruption, regional outage, traffic spike).

Milestone story once 1–3 exist: assign a project, rent emergency capacity, outage, monitoring discovers it, player moves the project, SLA and cash show the cost. Trust/hatred make the same story personal in phase 5.

---

## Locked meeting decisions

1. Accept requires `serverId`.
2. `unassign` is explicit **offline**, not “served with a missing route.”
3. Offline: SLA downtime; recurring pauses.
4. Trust is specified here; **no trust fields in phases 1–3**.
5. Trust event-only (no +0.5/hour). Mood deltas later. Hatred table as above.
6. Cross-region routing allowed in phase 1.
7. Single `RouteTarget`, not an array.
8. Sell allowed while the project is offline (park unpins the box).

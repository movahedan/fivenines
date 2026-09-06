# Engine capacity, region, and placement (v1)

Approved chat (2026-09-07). Extends [fivenines-engine-traffic.design.md](fivenines-engine-traffic.design.md). Replaces the earlier millicore-only capacity story.

Package stays `@packages/fivenines-engine`. Integers only. 1 `tick()` = 1 simulated hour. Demand stays **requests this hour**. Region is a **timezone bucket** on both projects and servers.

---

## Outcome

A constructed `Game` can:

- Place **projects** and **servers** in one of five regions
- Drive traffic **local hour** from the project’s region offset (no free-form `timezoneHours`)
- Assign each served project **prefer-local**, then **overflow** to other regions with extra latency
- Convert assigned requests into **CPU, network, and memory** via the project **category** cost vector
- Drop when any axis on a box exceeds its stock
- Keep Bronze overload: **UTC+0** constant 1400 vs one/two **UTC+0** Bronze — still a **CPU** proof

Lab: `buyServer` requires a region. No AWS API, prices, or AZs.

---

## Regions

Same enum on `ProjectInitial.region` and `AssetInitial` / `buyServer` payload.

| id | offsetHours |
|----|-------------|
| `utc-8` | −8 |
| `utc-5` | −5 |
| `utc+0` | 0 |
| `utc+1` | 1 |
| `utc+9` | 9 |

Unknown id throws at construct. `localHour(hourIndex, REGIONS[region].offsetHours)` — same wrap formula as today.

`TRAFFIC_POLICY.timezoneHours.min/max` go away; the enum is the allowlist.

Opening-board map (replace current `timezoneHours`):

| id | old TZ | region |
|----|--------|--------|
| acme-web | 0 | `utc+0` |
| acme-api | 1 | `utc+1` |
| acme-jobs | −5 | `utc-5` |
| northwind-shop | 3 | `utc+1` |
| northwind-search | 0 | `utc+0` |
| northwind-reports | 8 | `utc+9` |
| globex-portal | −2 | `utc+0` |
| globex-billing | 0 | `utc+0` |
| initech-tps | 0 | `utc+0` |
| initech-cover | 6 | `utc+9` |

Overload fixtures: projects + Bronzes all `utc+0`.

---

## Placement (prefer-local, overflow)

Demand is **not** one global integer. Tick walks **each served project**:

1. `R = project.tick(hourIndex, random)`
2. `local` = servers with `server.region === project.region`
3. Assign as many of `R` as **local compute headroom** allows, split by `computeUnitsPerHour` among local boxes (same floor + remainder as today’s split)
4. Remainder → **other-region** servers, split by compute stock
5. If still leftover → unroutable `droppedRequests`

A server accumulates **slices**: `{ category, requests, remote: boolean }`.

Remote slice ⇒ those requests count toward load **and** add `REMOTE_LATENCY_MS` to that box’s p95 mix (weighted by local vs remote assigned counts). Policy integer, v1: `40`.

Empty fleet / no servers anywhere: all `R` unroutable (unchanged).

---

## Category cost vector

Not SPA/SSR — the existing three traffic categories:

| category | cpuPerRequest | bytesPerRequest | memPerInflight |
|----------|---------------|-----------------|----------------|
| shopping | 1 | 40 | 2 |
| saas | 2 | 10 | 4 |
| portfolio | 1 | 20 | 1 |

Table lives in `catalog/capacity-policy.ts` (tunables only). CPU/net are **per request this hour**. Memory is **per in-flight**.

---

## Server stocks (SKU)

| field | Role |
|-------|------|
| `computeUnitsPerHour` | CPU budget this tick |
| `networkBytesPerHour` | Network budget this tick |
| `memoryMiB` | RAM stock |
| `baseMemoryMiB` | Always occupied (image / runtime) |

Bronze (1400-safe): compute **1000**, network **1_000_000**, memory **4096**, base **256**. One Bronze vs 1400 **saas** CPU load = `1400 * 2 = 2800` would break today’s 1400-as-requests proof.

**Keep the player-facing proof as 1400 requests, CPU-bound:** either

- saas `cpuPerRequest = 1` for v1 (shopping/portfolio also 1; differentiate **bytes** and **mem** first), or
- change fixtures to 500+500 if saas stays at 2.

**Decision (locked):** v1 `cpuPerRequest = 1` for all three categories. Differentiate shopping/saas/portfolio on **bytes** and **mem** only. CPU axis still varies **by SKU**, not by category, until a later initiative. Then 1400 requests vs Bronze 1000 compute still holds.

Silver–Diamond: scale compute 2×/4×/8×/16×; keep net and RAM fat (non-binding for 1400).

---

## Loads on a box this hour

Sum over slices on that server:

```
assignedRequests = sum(slice.requests)
cpuLoad = sum(slice.requests * cpuPerRequest(category))
netLoad = sum(slice.requests * bytesPerRequest(category))
inFlight = max(0, floor(assignedRequests * inflightPerThousandRequests / 1000))
memOcc = baseMemoryMiB + inFlight * (weighted memPerInflight by slice)
```

`inflightPerThousandRequests` in policy, v1 **10** (1400 rph ⇒ 14 in-flight). Little’s law with 20 ms latency at hourly grain is ~0 concurrent; this scale exists so RAM **can** bind on a tiny SKU without fake 26 s latency.

Fits:

- CPU: `cpuLoad <= computeUnitsPerHour`
- Net: `netLoad <= networkBytesPerHour`
- RAM: `memOcc <= memoryMiB`

If any fails: drop `assigned - handled` on that box. `handled` is the largest request count `≤ assigned` that fits all three (integer search from assigned downward, or scale by the tightest ratio and floor). v1: **scale by min of the three fit ratios, floor**, remainder dropped.

Utilization: `ratioPercent` of the **tightest** axis (load/cap). Latency: `BASE + util% * slope`, plus remote mix penalty as above.

Split **always** uses compute stock, never `requestCapacity`.

---

## Commands

```ts
{ type: "buyServer"; payload: { serverType: ServerCatalogId; region: RegionId } }
```

Existing tests pass `region: "utc+0"`. Lab: region control (select or one button group) + Buy Bronze.

`AssetInitial`: `{ kind: "server"; id; catalogId; region }`.

---

## Tests

- Overload 1400 UTC+0 Bronze: one drops, two clear, lower p95.
- `rg timezoneHours` empty in engine `src/` (tests use `region`).
- Prefer-local: two regions, demand only in A, servers only in B → all assigned slices `remote === true` and p95 > same-region control.
- Prefer-local: servers in A enough for R → zero remote.
- Overflow: local cap 500, R = 1000, remote boxes exist → 500 local + 500 remote.
- Category net: shopping vs saas same R, same box; shopping `netLoad` > saas.
- RAM: SKU with tiny `memoryMiB` + 1400 assigned → drops even if CPU/net fat.
- Construct throws on unknown region.
- Lab: Buy still works with a chosen region; Tick/Accept still drop with empty fleet.

---

## Out of scope

- AWS SKUs, prices, credits, AZs, CDN
- Per-category CPU cost (v1 CPU cost is 1)
- GPU, disk
- Sticky sessions, anycast
- Changing traffic rhythm tables

---

## Phases (see plan)

1. Region enum replaces `timezoneHours`; servers and `buyServer` carry region; 1400 same-region.
2. Prefer-local + overflow + remote latency.
3. Category bytes/mem vectors + CPU/net/RAM check (CPU cost 1); inflight occupancy.
4. Lab region picker; optional teaching SKU that is RAM- or net-bound.

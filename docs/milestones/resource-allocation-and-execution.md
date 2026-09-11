# Resource allocation and system execution

Milestone 5 of 10. Status: in progress on the M5 stack branch from [#111](https://github.com/movahedan/fivenines/pull/111) (`feature/m4-infrastructure-preparation-and-operations`). Execution plan: [`.cursor/plans/m5-resource-allocation-and-execution.plan.md`](../../.cursor/plans/m5-resource-allocation-and-execution.plan.md). Follow the [standing delivery workflow](README.md). No slice is claimed delivered until its PR exists.

## Outcome and boundaries

Connect generated demand to actual shared-server work and compute end-to-end project outcomes, including data movement that competes with serving traffic.

Run permutation and seeded stress checks in addition to exact fixtures. Record graph compilation and per-tick complexity measurements; avoid per-request objects and unnecessary graph rebuilds. Allocation replaces the place-demand step inside the existing `Game.tick` playlist from milestone 4; it does not add a second clock or a discovered phase registry.

## Prerequisites and sources

[Infrastructure preparation and operations](infrastructure-preparation-and-operations.md) and the numerical reference model from milestone 1.

Product sources: [gameplay](../product/gameplay.md), [domain model](../product/domain-model.md), [demand and projects](../product/balance/demand-and-projects.md), [hardware and economy](../product/balance/hardware-and-economy.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Resource allocator | Milestone prerequisite | Implement the approved heterogeneous resource budgets and proportional shared-server policy. Include retained memory/storage, eligible backlog, rounding and incompatible hardware. |
| Dependency graph execution | Resource allocator | Execute compiled required paths, branch joins and type-specific outcomes. Integrate queues and progress with no retries or subticks; compare against independent reference fixtures. |
| Transfers and migration completion | Dependency graph execution | Allocate actual network/disk and associated resource work to transfer operations. Enforce data readiness, source continuity and atomic migration handover. |
| First-project settlement and playtest | Dependency graph execution | Connect the acquaintance contract to real weekly settlement/renewal, credits, hourly owned/leased costs and recoverable debt. Play acceptance through the first billing cycle with a healthy and overloaded system before broad catalog integration. |
| Integrated runtime projections | Transfers and migration completion; First-project settlement and playtest | Replace old request-only capacity/SLA input assumptions with authoritative workload outcomes. Connect basic utilization and execution states to project components; run seeded contention and permutation scenarios. |

## Acceptance and verification

- The appointment contract is playable from its milestone 4 acceptance through actual demand, settlement and renewal. Compare rent/buy cash trajectories, verify that overload affects credits, and demonstrate debt recovery. Record decision clarity and pacing findings; passing equations alone do not pass this checkpoint.

- CPU, GPU, memory, disk space/I/O and network budgets are conserved under mixed workloads and multiple projects on one host.
- Existing queued work participates in fair demand shares. FIFO age within a share survives partial execution, while impossible work does not gain capacity from another host without an explicit valid path.
- Shared branches and downstream servers never double-count root successes or capacity. Dropped, expired, completed and retained work reconcile to input and prior state.
- A transfer progresses only with allocated resources; saturated I/O delays completion. Source serves during migration and target becomes active only after required state is ready.
- Interactive, queued, continuous and finite computational scenarios, including GPU work, agree with milestone 1 reference results. Latency is an aggregate estimate with documented limits, not fabricated per-request timing.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Connect compact host activity and embedded project Status/Performance/Finances to real resource outcomes. Show demand-based availability rather than labeling it time uptime; distinguish current service state from billing-period compliance. Inventory, project finances and the shell consume consistent costs and cash. Missing detailed telemetry must remain unavailable until monitoring exists; the UI cannot reconstruct a second solver. Verify a parked project continues its contractual demand/timing and costs, misses service normally, and resumes without resetting billing or stopping a co-hosted project. Preserve normal volatile-work and finite-job recovery rules. Hardware comparison must expose workload-relevant disk/GPU constraints beyond the four compact resource bars.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Milestone 5 stack base | In review | [#119](https://github.com/movahedan/fivenines/pull/119) | Docs/plan on #111 head; later slices fold in after merge |
| Resource allocator | Merged into #119 | [#120](https://github.com/movahedan/fivenines/pull/120) | [#76](https://github.com/movahedan/fivenines/issues/76); merged 2026-09-11 |
| Dependency graph execution | Merged into #119 | [#121](https://github.com/movahedan/fivenines/pull/121) | [#77](https://github.com/movahedan/fivenines/issues/77); merged 2026-09-11 |
| Transfers and migration completion | Merged into #119 | [#122](https://github.com/movahedan/fivenines/pull/122) | [#78](https://github.com/movahedan/fivenines/issues/78); merged 2026-09-11 |
| First-project settlement and playtest | In review | [#123](https://github.com/movahedan/fivenines/pull/123) | [#79](https://github.com/movahedan/fivenines/issues/79); stacked on #119 |
| Integrated runtime projections | In review | — | [#80](https://github.com/movahedan/fivenines/issues/80); stacked on #123 |

## Playtest findings (#79)

Seeded `FixedRandomSource(0.5)` on `openingInitial`: accept Maya, 5h setup (install + configure), start, then 168h. Numbers are cents.

| Session | Cash after start | Cash after first week | Settlement | Notes |
|---|---|---|---|---|
| Healthy owned Bronze | 14_425 | −6_365 | periodPpm 1_000_000, credit 0, recurring 8_000 | Prepaid week close does not re-charge the 8_000 advance. Opex plus the 18_000 buy put the wallet below zero; jail stays off (`DEBT_LIMIT_CENTS` 20_000). |
| Healthy leased Bronze | — | −13_796 | same SLA / 0 credit | Lease 147¢/h over setup + week is ~7_431¢ more expensive than owning after the purchase is already sunk. Last-hour `finance.leaseCents` 147 vs owned 0. |
| Overloaded (park 80h mid-week, then resume) | — | −9_830 | hoursServed 88, periodPpm 501_994, credit 4_190 (full prorated revenue) | Parked hours still emit and miss. Billing origin does not reset. Resume keeps the same close hour. |
| Debt recovery | — | −6_365 then **6_235** after sell | — | Unassign + sell credits 12_600 salvage (70% of 18_000). Never jailed. |

Pacing / decision clarity: one healthy acquaintance week on a bought Bronze is playable and SLA-clean, but cash is already negative, so a second owned box for Opening Shift (two served contracts) is not affordable from the same wallet. Lease (or salvage) is the teaching fork. Parking is not a cheap way to dodge SLA: prepaid credits wipe the prorated fee whenever ppm misses the 80% target.

Engine: `packages/fivenines-engine/src/playtest.first-project.test.ts`. Hub: Assign box + Install Application Runtime from the ops floor (`apps/web/src/routes/hub.test.tsx`).

## Runtime projection notes (#80)

Hub fleet cards now show DISK utilization from `server.metrics.diskLoad` plus GPU as **unavailable** on teaching SKUs (`gpuCount === 0`); market comparison lists disk MiB and GPU `none` beside CPU/RAM. Offers label **DEMAND** as baseline RPS, not cores. Active cards read service state, this-hour handled/emitted, last credit, and `game.pathHour` on the Active header. Telemetry copy stays `unavailable` — no reconstructed traces. `compileDemandGraph` stays a static lookup (≤8 nodes per type); permutation of `oneBronzeInitial` project order does not change handled totals (`src/projections.runtime.test.ts`). Hub tests ignore unexecuted `work/` and related kernel files in `bunfig.toml` the same way they already skip unused `rng.ts`.

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

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
| Milestone 5 stack base | In review | [#119](https://github.com/movahedan/fivenines/pull/119) | Docs/plan on #111 head; `bun overall` |
| Resource allocator | In review | [#120](https://github.com/movahedan/fivenines/pull/120) | [#76](https://github.com/movahedan/fivenines/issues/76); stacked on #119; `bun overall` |
| Dependency graph execution | In review | — | [#77](https://github.com/movahedan/fivenines/issues/77); stacked on #120; `bun overall` pending this PR |
| Transfers and migration completion | Planned | — | [#78](https://github.com/movahedan/fivenines/issues/78); not started |
| First-project settlement and playtest | Planned | — | [#79](https://github.com/movahedan/fivenines/issues/79); not started |
| Integrated runtime projections | Planned | — | [#80](https://github.com/movahedan/fivenines/issues/80); not started |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

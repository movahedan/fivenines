# Final architecture and mathematical model

Milestone 1 of 10. Status: planned; no implementation PR is claimed delivered. Follow the [standing delivery workflow](README.md).

## Outcome and boundaries

Agree and prove the contracts of the complete engine before replacing its runtime calculations. Produce durable technical documentation and executable numerical reference cases; this milestone does not claim a working redesigned campaign.

Engine technical documentation and reference tests belong with the engine, not in product prose. Record final paths and equation identifiers here when delivered. Do not create a second production solver disguised as a reference implementation.

## Prerequisites and sources

Current engine and merged hosting Phase 2; no new milestone prerequisite.

Product sources: [domain model](../product/domain-model.md), [gameplay](../product/gameplay.md), [demand and projects](../product/balance/demand-and-projects.md), [hardware and economy](../product/balance/hardware-and-economy.md), [contracts and time](../product/balance/contracts-and-time.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Responsibilities and state transitions | None | Add a checked-in repeatable baseline validator for IDs, DAG, references, mixtures, policy guards and version-one release closure. Map current Game, demand, capacity, placement, finance and SLA code to the final ownership boundaries. Define command validation, indexes, graph compilation invalidation and one outer-tick transition, including simultaneous completion, departure, settlement and renewal boundaries. |
| Resource and work reference model | Responsibilities and state transitions | Define dimensions and conservation equations for CPU, GPU, resident/queued memory, disk capacity and I/O, and network transfer. Implement independent analytical fixtures for heterogeneous contention, backlog shares, FIFO and bounded rounding; identify infeasible demand rather than hiding it behind arbitrary capacity. |
| Graph and outcome reference model | Resource and work reference model | Define required branches, shared downstream work, root success, waiting and latency estimation. Add independently calculated cases and permutation checks, plus an explicit runtime integration contract for later milestones. |

## Acceptance and verification

- Numerical fixtures cover CPU-bound, GPU-incompatible, memory-bound, network-bound and disk-bound cases. All resource dimensions have named units; retained capacity and per-tick throughput are distinct.
- Two projects sharing a host receive demand-proportional shares including eligible backlog; older compatible work is processed first within a share. Reordering projects or servers cannot create systematic preference.
- A converging dependency graph counts each customer outcome once. Required-child failure prevents root success, and optional work cannot manufacture additional customer demand.
- No internal subticks, per-request simulation or automatic retry is introduced. Fractional arithmetic and rounding conserve totals; latency estimation does not become a millisecond clock.
- A published transition table resolves setup completion, activation, work expiry, departure, income and learning-renewal coincidences against existing product rules. Contradictions are surfaced explicitly.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

No new player screen is required for mathematical proofs. Use existing lightweight diagnostics only if they help inspect the fixtures. The application must still start after each PR.

## Working agreements (documentation, not engine modules)

Product rules stay in [product docs](../product/index.md). Do not ship TypeScript tables that only restate them. When a later milestone implements a behavior, it follows these links and the live `Game` code.

**Current `Game.tick` order** (implemented): reset demand → generate and place demand → `server.tick` → SLA → opex → PAYG accrue → sticky jail → `hourIndex += 1` → daily PAYG settle → week close. `dispatch` is immediate and does not advance the clock. See [engine AGENTS](../../packages/fivenines-engine/AGENTS.md).

**Current vs later owners:** `Game` coordinates; `placeProjectDemand` + `Server` are today's placement/capacity; SLA/finance/commercial modules already exist; component graphs, relationships, and activation are later milestones. Rebuild processing structure on topology/config change, not every tick — when that compiler exists.

**Same-hour order** (product; mostly not in runtime yet):

| Collision | Resolution | Source |
|---|---|---|
| Period close and renewal | Settle the old period, apply departure, renew only if still active | [contracts and time](../product/balance/contracts-and-time.md) |
| Job completion and 100% refund cutoff | Lateness band first; beyond ten intervals termination wins; exactly ten stays 50% | [contracts and time](../product/balance/contracts-and-time.md) |
| Service hour and settlement | Classify → relationships → departure → settle; no double refund | [customers and offers](../product/balance/customers-and-offers.md) |
| Learning completion and tuition renewal | Completion before charging the new month | baseline `learning.completeBeforeRenewalAtSameBoundary` |
| Fractional setup patience | Withdraw at first hour at or after the threshold (acquaintance example: hour 39) | [customers and offers](../product/balance/customers-and-offers.md) |
| Hour 168 (daily and week) | Daily collection then period close, after `hourIndex` increment | contracts and time; **current `Game.tick`** |
| Activation vs acceptance | First 168h service period starts at activation; acceptance advance is not charged again | [contracts and time](../product/balance/contracts-and-time.md) |

**Contradiction to keep visible:** runtime jail is sticky; product credit-limit restrictions lift when debt recovers. Do not silently change jail in this milestone.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Responsibilities and state transitions | In progress (local) | — | Catalog checker only: `packages/fivenines-engine/src/baseline/` against [baseline.json](../product/balance/baseline.json). Guideline directories (ownership/tick/commands/indexes as code) removed. `bun test packages/fivenines-engine` after the cut. Live `Game.tick` unchanged. |
| Resource and work reference model | Planned | — | Not run |
| Graph and outcome reference model | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

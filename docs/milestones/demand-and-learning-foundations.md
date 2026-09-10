# Demand, work retention and learning foundations

Milestone 3 of 10. Status: in progress on [#104](https://github.com/movahedan/fivenines/pull/104), stacked on [#101](https://github.com/movahedan/fivenines/pull/101) (`docs/m2-base`). Follow the [standing delivery workflow](README.md). Execution plans: [`.cursor/plans/m3-demand-and-learning-foundations.plan.md`](../../.cursor/plans/m3-demand-and-learning-foundations.plan.md).

## Outcome and boundaries

Generate typed project demand and preserve waiting work correctly, while introducing the complete enrollment lifecycle needed by subsequent operational capabilities.

Keep research permissions distinct from installation. Numerical arrival checks must state sample size and tolerances; statistical evidence does not prove queue or resource-allocation correctness.

## Prerequisites and sources

[Entities and catalogs](entities-and-catalogs.md), using the mathematical contracts from milestone 1.

Product sources: [gameplay](../product/gameplay.md), [demand and projects](../product/balance/demand-and-projects.md), [technology and research](../product/balance/technology-and-research.md), [courses and incidents](../product/balance/courses-and-incidents.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Typed demand generation | Milestone prerequisite | Implement per-project DemandEngine generation only, with workload mixtures, local-time rhythms, campaigns, spikes and controllable randomness. Cover interactive, queued, continuous and finite GPU/CPU work. |
| Batch retention and queue state | Typed demand generation | Represent arrival cohorts, compatible progress, durable versus volatile work, occupancy and overflow. Define execution inputs and expiry transitions without implementing a substitute resource solver. |
| Enrollment and tuition lifecycle | Milestone prerequisite | Implement two shared learning slots, prerequisites, upfront monthly tuition, pause/resume/cancel and completion. Use a shared money-posting boundary that milestone 6 will extend, not a separate learning wallet. |
| Learning and demand integration | Batch retention and queue state; Enrollment and tuition lifecycle | Expose unlocks and skill effects as authoritative state, connect Learning screens and inspect demand through existing diagnostics. Effects whose consumers do not yet exist remain explicit, not simulated. |

## Acceptance and verification

- Seeded generation reproduces samples for a fixed initial state and input sequence; project-local time shifts rhythms without treating every project as a website.
- Waiting groups retain original age and compatible progress. Queue fullness rejects excess new work; aggregation does not reset deadlines or create free storage.
- Generation has no authority over placement or execution. Representative fixtures cover all four work families and GPU requirements before the allocator is integrated.
- Two concurrent courses/research enrollments share the same slot limit. Courses progress through at most five levels; technology research does not stack.
- Upfront monthly charges, insufficient-funds pause, retained progress, slot release, cancellation and resumption within paid coverage follow the product baseline. Completion at a renewal boundary avoids an unnecessary renewal charge.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Connect Learning catalog, inline enrollment details and distinct learning progress indicators in the desktop top bar/mobile strip to the final design. Completed course levels and active enrollments are different projections; show both shared slots, tuition coverage and resumption blockers. Use authored research durations, prices and prerequisites, not the export's hour-scale fixtures. Include locked, active, paused, completed and insufficient-funds states. Do not wait until milestone 9 to make learning usable.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Milestone 3 stack base | In review | [#104](https://github.com/movahedan/fivenines/pull/104) | Docs/plans only; `bun run overall` locally |
| Typed demand generation | In review | this slice on #104 | engine tests + `bun run overall` |
| Batch retention and queue state | Planned | [#68](https://github.com/movahedan/fivenines/issues/68) | Not run |
| Enrollment and tuition lifecycle | Planned | [#69](https://github.com/movahedan/fivenines/issues/69) | Not run |
| Learning and demand integration | Planned | [#70](https://github.com/movahedan/fivenines/issues/70) | Not run |

M2 [#66](https://github.com/movahedan/fivenines/issues/66) Hub/Lab shared-asset identity remains incomplete on #101. M3 does not pretend Projects/Inventory already share topology identities. Opening Shift still uses RPS `ProjectDemand`; typed DemandEngine is a later slice on this stack.

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

# Infrastructure preparation and operations

Milestone 4 of 10. Status: in progress on the M4 stack branch from [#104](https://github.com/movahedan/fivenines/pull/104) (`feature/m3-demand-and-learning-foundations`). Execution plan: [`.cursor/plans/m4-infrastructure-preparation-and-operations.plan.md`](../../.cursor/plans/m4-infrastructure-preparation-and-operations.plan.md). Follow the [standing delivery workflow](README.md). No slice is claimed delivered until its PR exists.

## Outcome and boundaries

Make a project system something the player prepares and operates: installation, shared configuration, readiness, power and project-scoped duplication become authoritative work.

Bring forward the first acquaintance contract, acceptance advance, setup cancellation and activation billing origin from milestone 6 using the milestone 3 ledger boundary. The complete service settlement path arrives with actual execution in milestone 5; generalized contracts and growth remain milestone 6.

## Prerequisites and sources

[Demand, work retention and learning foundations](demand-and-learning-foundations.md).

Product sources: [gameplay](../product/gameplay.md), [domain model](../product/domain-model.md), [interaction specification](../product/interaction-specification.md), [contracts and time](../product/balance/contracts-and-time.md), [courses and incidents](../product/balance/courses-and-incidents.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Acquaintance acceptance and advance | Milestone prerequisite | Implement the first offer page, full Contract Review, upfront payment, setup allowance and subsequent patience/cancellation/refund, and explicit activation billing origin using the shared ledger boundary. |
| Operational queue and readiness | Acquaintance acceptance and advance | Implement the single player operational queue, prerequisites, retained progress and skill-adjusted work. Define explicit ready/active states; readiness never silently starts a contract. |
| Installation and configuration actions | Operational queue and readiness | Connect project service installation and shared configuration to instances. Implement power commands and their effects on readiness and volatile work, preserving persistent data. |
| Duplication and transfer lifecycle | Installation and configuration actions | Implement project-only duplication preparation, destination compatibility and pending data-transfer state. Source service continues during preparation; completed data movement awaits milestone 5 allocation. |
| System workspace operations | Duplication and transfer lifecycle | Integrate rack, installed-module selection, contextual actions and operational progress with desktop/mobile interaction hierarchy. Revalidate destructive/shared-asset actions against current engine state. |

## Acceptance and verification

- Contract Review preserves offer identity on Back and never charges on Close. Setup allowance expiration starts the agreed patience policy rather than immediate cancellation. A signed contract remains inspectable before hardware acquisition. Park is unavailable during initial setup and cannot stop another project on shared hardware.

- Accepting the acquaintance contract posts the actual advance once; cancelling during setup applies its agreed refund. The explicit Start action requires readiness and starts the project billing period, not a global week boundary. Buy/lease and setup costs use the shared money state.

- The first-project preset uses two installs and one shared configuration task for its documented five-hour baseline; per-technology configuration is not charged a second time.
- Power-on is immediate. Software readiness can still require work. Power-off loses volatile work and preserves durable data; it is not equivalent to software failure.
- One completed service configuration applies to all its instances at the agreed boundary. Existing player skill benefits apply without historical skill snapshots.
- Duplicating one project never copies unrelated projects from the same server. Reduced preparation uses the catalog factor and skill; destination capacity and data are not free.
- Transfers remain pending until real throughput is provided by milestone 5. Activation cannot report success when required deployment or data readiness is missing.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Deliver the approved desktop left Projects panel, right business panels and mobile navigation, central offer/Contract Review pages, and vertically arranged project sections. Reuse the main workspace server-rack design in acquisition and Inventory details. Connect the rack/software action hierarchy, bottom-drawer object inspectors on both devices, acquisition/impact drawers and distinct task indicators in the desktop top bar/mobile progress strip. Acceptance opens setup before hardware exists; setup checklist items open the object drawer at real install/configure actions. Add server remains available after the first acquisition. Include project-scoped Park/Resume controls and blockers from Gameplay, with execution/accounting verified in milestone 5. Use basic state now; detailed monitoring arrives in milestone 7.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Milestone 4 stack base | In review | [#111](https://github.com/movahedan/fivenines/pull/111) | Docs/plan on #104 head; `bun overall` |
| Acquaintance acceptance and advance | In review | [#112](https://github.com/movahedan/fivenines/pull/112) | `bun overall` on `feature/m4-acquaintance-acceptance-and-advance` stacked on [#111](https://github.com/movahedan/fivenines/pull/111) |
| Operational queue and readiness | Planned | — | Not run |
| Installation and configuration actions | Planned | — | Not run |
| Duplication and transfer lifecycle | Planned | — | Not run |
| System workspace operations | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

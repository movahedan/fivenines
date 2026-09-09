# Infrastructure preparation and operations

Milestone 4 of 10. Status: planned; no implementation PR is claimed delivered. Follow the [standing delivery workflow](README.md).

## Outcome and boundaries

Make a project system something the player prepares and operates: installation, shared configuration, readiness, power and project-scoped duplication become authoritative work.

Activation readiness is implemented here; acceptance advances, setup cancellation and billing policy are integrated in milestone 6. Early fixtures may establish prepared projects directly without claiming the full business loop is complete.

## Prerequisites and sources

[Demand, work retention and learning foundations](demand-and-learning-foundations.md).

Product sources: [gameplay](../product/gameplay.md), [domain model](../product/domain-model.md), [interaction specification](../product/interaction-specification.md), [contracts and time](../product/balance/contracts-and-time.md), [courses and incidents](../product/balance/courses-and-incidents.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Operational queue and readiness | Milestone prerequisite | Implement the single player operational queue, prerequisites, retained progress and skill-adjusted work. Define explicit ready/active states; readiness never silently starts a contract. |
| Installation and configuration actions | Operational queue and readiness | Connect project service installation and shared configuration to instances. Implement power commands and their effects on readiness and volatile work, preserving persistent data. |
| Duplication and transfer lifecycle | Installation and configuration actions | Implement project-only duplication preparation, destination compatibility and pending data-transfer state. Source service continues during preparation; completed data movement awaits milestone 5 allocation. |
| System workspace operations | Duplication and transfer lifecycle | Integrate rack, installed-module selection, contextual actions and operational progress with desktop/mobile interaction hierarchy. Revalidate destructive/shared-asset actions against current engine state. |

## Acceptance and verification

- The first-project preset uses two installs and one shared configuration task for its documented five-hour baseline; per-technology configuration is not charged a second time.
- Power-on is immediate. Software readiness can still require work. Power-off loses volatile work and preserves durable data; it is not equivalent to software failure.
- One completed service configuration applies to all its instances at the agreed boundary. Existing player skill benefits apply without historical skill snapshots.
- Duplicating one project never copies unrelated projects from the same server. Reduced preparation uses the catalog factor and skill; destination capacity and data are not free.
- Transfers remain pending until real throughput is provided by milestone 5. Activation cannot report success when required deployment or data readiness is missing.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Deliver the rack/software action hierarchy, basic activity summary, selection inspector and bottom drawers from the interaction specification. Desktop rails and mobile navigation preserve the system workspace. Use basic state now; detailed monitoring arrives in milestone 7.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Operational queue and readiness | Planned | — | Not run |
| Installation and configuration actions | Planned | — | Not run |
| Duplication and transfer lifecycle | Planned | — | Not run |
| System workspace operations | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

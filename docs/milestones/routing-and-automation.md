# Routing and automation

Milestone 8 of 10. Status: planned; no implementation PR is claimed delivered. Follow the [standing delivery workflow](README.md).

## Outcome and boundaries

Allow researched infrastructure automation to distribute traffic and recover service through healthy targets, ready replicas and replacement capacity.

Implement each capability with its research permission and runtime overhead here; milestone 9 verifies completeness rather than postponing automation prerequisites.

## Prerequisites and sources

[Observation, incidents and recovery](observation-incidents-and-recovery.md), with transfer and allocator foundations from milestone 5.

Product sources: [gameplay](../product/gameplay.md), [technology catalog](../product/technology-catalog.md), [interaction specification](../product/interaction-specification.md), [courses and incidents](../product/balance/courses-and-incidents.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Load balancing and health checks | Milestone prerequisite | Implement compatible routing targets, nested balancers and independent observed health checks. Use automatic usable-capacity weighting and reject routing loops. |
| Replication and failover | Load balancing and health checks | Integrate real replication work/readiness and single-primary failover. A configured standby is not ready merely because a node exists. |
| Replacement and automatic leasing | Replication and failover | Implement authorized replacement policy, compatible available capacity selection and automatic leasing under current technology/credit constraints. Reuse operational preparation and transfer state machines. |
| Automation UI and failure scenarios | Replacement and automatic leasing | Connect balancer actions and automation status to final components. Verify concurrent failures, blocked replacement, repaired originals and stale selected targets. |

## Acceptance and verification

- Nested routing preserves capacity and root counts; configured invalid or cyclic paths are rejected atomically. Players select targets, not manual traffic weights.
- Health checks work independently of monitoring and use detected health, without granting diagnostic evidence for free.
- Only usable independent replicas can take over. Single-primary invariants hold when failure, replication completion and topology changes coincide.
- Replacement uses existing eligible capacity before required leasing, respects researched capabilities and rechecks credit. No automatic hardware purchase or duplicated replacement task occurs.
- A repaired original is not silently made primary or used to reverse a completed replacement. Recovery actions use the same preparation/transfer/learning rules as manual work.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Deliver nested-balancer selection and contextual actions, target availability, pending failover/replacement and blocked-cost warnings. Extend the approved infrastructure workspace for graph and target actions absent from the export; preserve mobile/desktop bottom-drawer semantics for contextual target and impact flows. Central offer/contract pages are outside that drawer rule. Implement Select source → Connect → Select compatible destination with touch and keyboard access and no required drag. Use the same bottom-drawer context for target selection and recovery; graph-library selection still requires native compatibility verification.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Load balancing and health checks | Planned | — | Not run |
| Replication and failover | Planned | — | Not run |
| Replacement and automatic leasing | Planned | — | Not run |
| Automation UI and failure scenarios | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

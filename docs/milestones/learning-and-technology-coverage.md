# Complete learning and catalog coverage

Milestone 9 of 10. Status: planned; no implementation PR is claimed delivered. Follow the [standing delivery workflow](README.md).

## Outcome and boundaries

Close the gap between the authored technology/course catalog and real engine capabilities, completing specialization effects and their player-facing explanations.

This milestone is not permission to delay capabilities needed by milestones 4–8. The initial coverage audit determines the remaining family-specific PR count; keep its evidence table as a delivery artifact, not a second numeric catalog.

## Prerequisites and sources

[Routing and automation](routing-and-automation.md); enrollment lifecycle already delivered in milestone 3.

Product sources: [technology catalog](../product/technology-catalog.md), [technology and research](../product/balance/technology-and-research.md), [courses and incidents](../product/balance/courses-and-incidents.md), [demand and projects](../product/balance/demand-and-projects.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Capability coverage audit and first completion group | Milestone prerequisite | Map every authored technology, workload feature and course effect to implementation and evidence. Complete remaining application/data capabilities; explicitly list any proposed scope change rather than hiding entries. |
| Workload specialization completion | Capability coverage audit and first completion group | Complete remaining communication, delivery and computational capability behaviors, dependencies and overheads. Split this slice by independent technology families when current-code review size requires it. |
| Skill and progression integration | Workload specialization completion | Verify all course families and levels against operation, risk, efficiency and recovery consumers. Complete learning explanations and full catalog prerequisite/eligibility journeys. |

## Acceptance and verification

- Every technology in the baseline has a documented implemented capability, required deployment/resource behavior and at least one meaningful verification scenario. No research-only placeholder is marked complete.
- Each project feature maps to supporting technologies and a compatible executable workload, including email, chat, streaming, payments and computational examples.
- Every course family and level applies its approved cumulative effect to the correct consumer, including existing configurations; tuition and enrollment retain milestone 3 semantics.
- Research knowledge does not auto-install software. Permissions, instance readiness, coverage and resource overhead remain separate.
- Catalog changes pass reference/DAG validation and stay isolated from engine mechanics. Any removal or material behavior change is recorded as a product decision.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Complete technology prerequisite views, course effect explanations and project requirement links. Players can understand what research unlocks and what still needs installation and capacity.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Capability coverage audit and first completion group | Planned | — | Not run |
| Workload specialization completion | Planned | — | Not run |
| Skill and progression integration | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

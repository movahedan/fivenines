# Remaining delivery and verification work

The product and interface discussion is complete for the current design handoff. There is no remaining general product questionnaire. Catalogs and coefficients were delegated and have an authored design-0.2 baseline; they are not measured runtime balance. New questions should identify a concrete contradiction or a necessary scope change, not reopen settled decisions.

## Ready for use

- Product identity, entities, lifecycle, obligations, relationships, learning and recovery rules.
- Delegated catalogs: 61 technologies, nine hardware choices, 23 demand types, 12 continuous templates, five finite-job templates and five course families.
- Approved navigation, bottom drawers, project workspace and object/action hierarchy.
- [Figma Make handoff](figma-make-handoff.md), [interface brief](interface-design-brief.md) and [interaction specification](interaction-specification.md).
- [Replacement execution plan](../../.cursor/plans/project-systems-transition.plan.md); obsolete plans and completed review reports are removed.

## Remaining work, not unanswered product questions

| Work | What still needs evidence |
|---|---|
| Figma prototype generation and review | Produce actual desktop/mobile frames and linked flows; verify all interaction states and accessibility. Documents alone are not a finished visual design |
| Aggregate solver | Prove and implement multi-resource allocation, branch completion, queue transitions and latency estimates with conservation and order independence |
| Data structures and lifecycle | Implement indexes, graph representation, batch state, service configuration and instance transitions against current Phase 2 code |
| Routing and recovery | Verify readiness, replication, data transfer, observed health, incidents, replacement and automatic leasing under contention |
| Contracts and balance | Implement exact settlement and learning boundaries; run seeded scenarios and gameplay sessions, including distress/recovery |
| Native-compatible UI | Select graph/chart rendering and interaction implementations; connect engine projections to approved components and flows |

Each implementation slice needs its own tests and documentation synchronization before a PR. The replacement plan gives surfaces, dependency order and gates; it is not proof that the solver or runtime migration is complete.

## Explicitly deferred

- Canvas connection gesture selection (drag versus Connect-and-select); compatibility and loop rules are settled.
- State/command protocol, versioned snapshots and SSE synchronization. Login and eventual server authority are settled; frontend engine development continues for now.
- Away-time simulation and its return report.
- Employee hiring, assignment and management. Player courses and two shared learning slots remain in current scope.
- Geographic latency redesign. Preserve project-local time and existing region semantics until separately redesigned.

## Excluded

Guest gameplay, permanent jail, Opening Shift as a timed mode, request retries, internal subticks, manual resource shares/routing weights, whole-server cross-project duplication, negotiation/master agreements, automatic hardware purchase and a dedicated Monitoring down notification.

## Validation boundary

The authored balance checks establish catalog consistency and analytical examples. Engine tests must still establish shared-resource conservation, fairness, graph accounting, incident attribution and settlement correctness. Playtesting may change isolated policy values without silently rewriting accepted contracts or introducing new mechanics. See [Validation](balance/validation.md) for the actual evidence and limitations.

# Remaining delivery and verification work

The product and interface discussion is complete for the current design handoff. There is no remaining general product questionnaire. Catalogs and coefficients were delegated and have an authored design-0.3 baseline; they are not measured runtime balance. New questions should identify a concrete contradiction or a necessary scope change, not reopen settled decisions.

## Infrastructure editor integration decisions

The [editor interaction](infrastructure-editor.md) is approved; the following details remain to resolve before their dependent engine changes in the [delivery bridge](../milestones/infrastructure-editor-and-interface-redesign.md):

- Map drawn host links to logical service dependencies and instance routing while preserving shared configuration; distinguish routing from dependency and placement.
- Define proposal acquisition/power/removal scope, temporary identities, purchase/lease timing, fresh validation, duplicate submissions and rejection/partial-apply semantics. Warning modal and edit preservation are agreed; they do not alone settle transactions.
- Define mixed runnable/blocked preparation behavior and effects on already-running configured services.
- Choose longer preparation work through first-project timing, patience/refund and affordability tests; preserve existing skill effects. No numeric replacement is approved yet.
- Define host selection for the independent circular hosted load-balancer node in M8.

These do not block visual-only component work. They block only the affected real engine behavior; no UI-local rules may fill the gap.

## Ready for use

- Product identity, entities, lifecycle, obligations, relationships, learning and recovery rules.
- Delegated catalogs: 31 version-one technologies, 13 demand types, nine continuous templates and two finite-job templates; nine hardware choices and five course families. Twelve additional technologies, seven demand types, three continuous templates and three finite-job templates are disabled expansion candidates, not release requirements.
- Reconciled 2026-09-10 navigation, central offer/contract pages, contextual drawers, project workspace and object/action hierarchy, including existing Park/offline intent.
- [Figma Make handoff](figma-make-handoff.md), [interface brief](interface-design-brief.md) and [interaction specification](interaction-specification.md).
- [Delivery milestones](../milestones/README.md), including proposed PR slices and acceptance scenarios; obsolete plans and completed review reports are removed.

## Remaining work, not unanswered product questions

| Work | What still needs evidence |
|---|---|
| Figma reference and interaction completion | Design received and shell/workspace layout approved; preserve it in `apps/figma-design`. Implement missing action flows and correct fixtures/accessibility under the existing [delivery milestones](../milestones/README.md). The export is not a complete playable application |
| Aggregate solver | Prove and implement multi-resource allocation, branch completion, queue transitions and latency estimates with conservation and order independence |
| Data structures and lifecycle | Implement indexes, graph representation, batch state, service configuration and instance transitions against current Phase 2 code |
| Routing and recovery | Verify readiness, replication, data transfer, observed health, incidents, replacement and automatic leasing under contention |
| Contracts and balance | Implement exact settlement and learning boundaries; run seeded scenarios and gameplay sessions, including distress/recovery |
| Native-compatible UI | Select graph/chart rendering and interaction implementations; connect engine projections to approved components and flows |

Each implementation slice needs its own tests and documentation synchronization before a PR. The milestones give outcomes, dependency order and gates; they are not proof that the solver or runtime migration is complete.

## Explicitly deferred

- State/command protocol, versioned snapshots and SSE synchronization. Login and eventual server authority are settled; frontend engine development continues for now.
- Away-time simulation and its return report.
- Employee hiring, assignment and management. Player courses and two shared learning slots remain in current scope.
- Geographic latency redesign. Preserve project-local time and existing region semantics until separately redesigned.

## Excluded

Guest gameplay, permanent jail, Opening Shift as a timed mode, request retries, internal subticks, manual resource shares/routing weights, whole-server cross-project duplication, negotiation/master agreements, automatic hardware purchase and a dedicated Monitoring down notification.

## Validation boundary

The authored balance checks establish catalog consistency and analytical examples. Engine tests must still establish shared-resource conservation, fairness, graph accounting, incident attribution and settlement correctness. Playtesting may change isolated policy values without silently rewriting accepted contracts or introducing new mechanics. See [Validation](balance/validation.md) for the actual evidence and limitations.

# Observation, incidents and recovery

Milestone 7 of 10. Status: planned; no implementation PR is claimed delivered. Follow the [standing delivery workflow](README.md).

## Approved interface integration amendment

**Dependencies:** Consume the shared proposal/target/preparation contracts from the [delivery bridge](infrastructure-editor-and-interface-redesign.md) as well as M6.

**Changes to the proposed slices:** Extend coverage and recovery queries with eligible project components, prerequisites and real preparation tasks. Use existing bottom drawers, checklist and status slots instead of a new inspector layout.

**Additional acceptance:** Verify host versus coverage selection, missing observations, actual recovery work and no hidden-cause exposure. Populate designed empty sections only when real support exists.

Status: planned; this documentation amendment does not claim implementation.

## Outcome and boundaries

Make failures, diagnosis and recovery obey actual coverage, data survival and customer responsibility, with useful historical feedback.

Fault injection and seeded probability checks serve different purposes: prove transitions with injected faults, then validate configured incidence statistically. Preserve hidden-cause boundaries in every UI projection.

## Prerequisites and sources

[Contracts, economy and business growth](contracts-economy-and-growth.md).

Product sources: [gameplay](../product/gameplay.md), [interaction specification](../product/interaction-specification.md), [observation](../product/balance/observation.md), [courses and incidents](../product/balance/courses-and-incidents.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Coverage and historical metrics | Milestone prerequisite | Implement monitoring installations, resource overhead, selected-component coverage, historical aggregation and retained error records. Separate observed facts from internal causes. |
| Incidents and attribution | Coverage and historical metrics | Deliver a configuration incident, Monitoring diagnosis and repair first, then run the commercial recovery playtest. Extend to hardware, software and data incidents, current skill and Quality Checks effects, and prospective attribution. |
| Repair and persistent recovery | Incidents and attribution | Integrate repair/restart and backups/restore using real operational and transfer capacity. Respect surviving data, unavailable hosts and irreversible loss. |
| Checkpoints and observation UI | Repair and persistent recovery | Implement checkpoint creation/usability/manual continuation with original job timing, then connect detailed charts, period explanations, errors and alerts to coverage-aware projections. |

## Acceptance and verification

- Before broad recovery completion, combine running Monitoring, one diagnosed configuration incident and repair with the milestone 5 commercial loop. Play the failure and recovery, record whether monitoring changes a meaningful decision, and compare known versus unknown responsibility. Use the normal incident/repair paths with a controlled test seed or fixture.

- Current plus two completed billing periods are retained and bounded. Missing coverage produces gaps, not zeros or retrospective backfill. Small and detailed charts agree with their source aggregates.
- Monitoring can cover selected components of one project across hosts. Losing it does not trigger a dedicated monitoring-down alert; basic server red status remains visible.
- Unknown cause is attributed under the agreed default policy. Later diagnosis changes responsibility prospectively without retroactively inventing trust credits.
- Hardware/configuration and customer software/data incidents apply distinct relationship outcomes. Current configuration skill and separately researched/deployed Quality Checks modify the appropriate probabilities.
- Backup and checkpoint transfers compete for resources and require usable retained data. A finite job without a usable checkpoint cannot be resurrected; continuation retains its original deadline.
- Repairing a shared host affects all dependent projects; restoring one project must not overwrite another project. Recovery does not introduce demand retries.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Complete monitoring details, error/alert activity, diagnostic and repair actions. Embedded project Status may use compact availability bars; Performance and Finances use detailed line/multi-series charts and explanatory records. All retain period selection, meaningful units, coverage gaps and accessible point details. An instantaneous outage is not automatically a period SLA breach; pressure alerts use the configured threshold and persistence. Basic status and contractual/accounting facts remain accessible without Monitoring, while detailed resource history and attribution require coverage. Compare chart/rendering candidates for the actual shared React Native stack before adding dependencies.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Coverage and historical metrics | Planned | — | Not run |
| Incidents and attribution | Planned | — | Not run |
| Repair and persistent recovery | Planned | — | Not run |
| Checkpoints and observation UI | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

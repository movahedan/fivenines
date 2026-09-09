# Balance baseline

This design-0.3 baseline answers delegated catalog and numeric design work. It is an authored starting balance, not measured production balance, and does not change the running engine. Playtesting may revise numbers while preserving agreed rules.

[baseline.json](baseline.json) is the numeric source for this design package. Tables in the companion documents are generated views or explanations. Keep these files together; do not scatter tunables through simulation classes or UI code.

| File | Responsibility |
|---|---|
| [Technology and research](technology-and-research.md) | Full catalog, prerequisites, learning and installation costs |
| [Demand and projects](demand-and-projects.md) | Work types, resource costs, mixtures, arrival model |
| [Hardware and economy](hardware-and-economy.md) | Hardware options, operating costs, cash-flow checks |
| [Contracts and time](contracts-and-time.md) | Accounting boundaries, job terms, operations and clock |
| [Observation](observation.md) | Metrics, history, notifications, forecasts |
| [Customers and offers](customers-and-offers.md) | Relationship coefficients, patience, offer progression, and commercial defaults |
| [Courses and incidents](courses-and-incidents.md) | Five-level courses, incident rates, and checkpoint costs |
| [Validation](validation.md) | Static consistency and analytic balance evidence |

## Runtime configuration boundary

Preserve the existing `packages/fivenines-engine/src/catalog/` boundary. Future runtime catalog data and policy numbers belong there in focused modules: technology-catalog, research-policy, project-catalog, demand-catalog, traffic-policy, hardware-catalog, capacity-policy, economy-policy, commercial-policy, operation-policy, time-policy, and observation-policy. They are future module responsibilities, not new runtime files created by this documentation task.

Simulation classes consume validated, versioned configuration; UI consumes descriptions and computed results. Do not embed balance literals in Game, Server, DemandEngine, UI components, or transport handlers. Keep invariant algorithms, validation, and indexing outside raw tuning tables. Validate references and the technology DAG when loading configuration, not on every tick. Record catalog version in snapshots. Structural changes need migration; hot-reloading arbitrary values into an ongoing game is not implied. Accepted contract terms remain frozen for that contract; changing a catalog does not silently rewrite signed terms.

Economy uses fictional game currency, and hardware coefficients are game models, not current market prices or vendor benchmarks. No retries, no subticks, no guest play, no timed game ending, no staff or away-time implementation are introduced here.

## Release membership

Technology, demand, project and finite-job entries carry `release: "v1"` or `"expansion"`. Only version-one entries participate in the initial release; expansion candidates are disabled by default. Validate that every version-one dependency and project workload remains within version one. The [catalog scope](../technology-catalog.md#version-one-scope) explains the cuts. This is authored design data, not an implemented runtime feature flag.

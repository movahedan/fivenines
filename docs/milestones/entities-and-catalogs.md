# Entities and catalogs

Milestone 2 of 10. Status: in progress. Stack root is the M2 base branch on top of [#98](https://github.com/movahedan/fivenines/pull/98) (M1). Follow the [standing delivery workflow](README.md).

## Outcome and boundaries

Replace the one-project/one-server assumption with project services, deployment instances and shared infrastructure identities, backed by validated catalog and policy modules.

Primary surfaces: engine entities, src/catalog, exports and fixtures; web adapters and display-only UI props. Preserve owned/leased tenure. Do not expand into Nest, authentication, generated SDKs or persistence migration.

## Prerequisites and sources

[Final architecture and mathematical model](engine-architecture-and-mathematics.md).

Product sources: [domain model](../product/domain-model.md), [technology catalog](../product/technology-catalog.md), [index](../product/balance/index.md), [repository boundaries](../product/repository-boundaries.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Catalog and identity foundations | Milestone prerequisite | Keep the authored JSON checker and live `src/catalog/` TypeScript. Add identity ownership and hour-index contracts. Do not add a catalog compiler. |
| Project services and shared assets | Catalog and identity foundations | Represent service configuration, instances, placement and dependency edges independently. Validate candidate mutations atomically; compile or invalidate graph indexes on topology/configuration changes. |
| Application model integration | Project services and shared assets | Move current consumers and fixtures to the new identities. Connect project and inventory projections to their corresponding shared UI components; remove incompatible old assumptions rather than maintaining two engines. |

## Acceptance and verification

- Two projects reference one physical server; inventory and both project views resolve the same asset and capacity.
- Two instances of one service share logical configuration but retain independent host, readiness and health. A different project remains unaffected by a configuration mutation.
- Missing and duplicate IDs, invalid placements, technology prerequisite cycles and invalid dependency edges are rejected without partial state changes.
- All tunable factors remain in isolated catalog/policy TypeScript modules. Product baseline JSON is validated by `src/baseline/` and is not loaded or compiled into `Game`. A later cutover replaces those live modules (or a versioned runtime snapshot); it does not add a translator pipeline.
- Hub and Lab still launch. Unsupported actions expose incomplete availability honestly; no direct accept-to-served behavior is represented as the redesigned preparation flow.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Introduce the final project/asset display identity and selection contracts in Projects and Inventory. Use the main project workspace rack as the shared server visual in project, Inventory and acquisition representations; adapt density and content without introducing unrelated server designs. Keep layout coordinates outside the engine. Detailed operations arrive with milestone 4.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Milestone 2 stack base (M1 closeout) | In review | [#101](https://github.com/movahedan/fivenines/pull/101) | Stacked on #98. `bun overall` on `docs/m2-base`. M1 records closed out; M2 PR plans written. |
| Catalog and identity foundations | In review | [#102](https://github.com/movahedan/fivenines/pull/102) | Stacked on #101. `IdentityRegistry` + `assertHourIndex`; no catalog compiler. `src/baseline/` remains the JSON checker. Live SKUs stay Bronze. `Game` unwired. |
| Project services and shared assets | In review | [#103](https://github.com/movahedan/fivenines/pull/103) | Stacked on #102. `TopologyGraph` services/instances/shared assets; `Game` unwired. `bun overall`. |
| Application model integration | Planned | — | Issue [#66](https://github.com/movahedan/fivenines/issues/66). Plan: `.cursor/plans/m2-application-model-integration.plan.md` (revalidate after #65) |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

## Catalog cutover (durable)

Do not compile `baseline.json` into a parallel runtime catalog. Live numbers stay in `packages/fivenines-engine/src/catalog/*.ts`. The authored JSON stays a design pack plus the M1 checker. When Opening Shift / Bronze are replaced, write the new integers into those modules or a single versioned runtime snapshot — one boot source, no translator object.

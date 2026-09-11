# Entities and catalogs

Milestone 2 of 10. Status: in progress on [#101](https://github.com/movahedan/fivenines/pull/101), stacked on [#98](https://github.com/movahedan/fivenines/pull/98). Follow the [standing delivery workflow](README.md). Execution plan: [`.cursor/plans/m2-entities-and-catalogs.plan.md`](../../.cursor/plans/m2-entities-and-catalogs.plan.md). **Merge target is #101**, not the former stacked slice PRs ([#102](https://github.com/movahedan/fivenines/pull/102) / [#103](https://github.com/movahedan/fivenines/pull/103), closed into #101). Milestone 3 is [#104](https://github.com/movahedan/fivenines/pull/104) on this same head.

## Interface-driven follow-up (planned)

F1 audits and completes live service/instance/shared-asset integration against the existing acceptance criteria. F2 adds requirement and proposed-state eligibility queries using those same identities. Separate remaining integration gaps from newly approved interaction behavior; do not introduce another topology owner.

Execution timing and gates: [F1–F3 delivery bridge](infrastructure-editor-and-interface-redesign.md). These follow-ups execute in M5.2, after M5.1 completes; they are not part of M5.1. This amendment does not change the historical PR/merge claims below.

## Outcome and boundaries

Replace the one-project/one-server assumption with project services, deployment instances and shared infrastructure identities, backed by validated catalog and policy modules.

Primary surfaces: engine entities, src/catalog, exports and fixtures; web adapters and display-only UI props. Preserve owned/leased tenure. Do not expand into Nest, authentication, generated SDKs or persistence migration.

## Prerequisites and sources

[Final architecture and mathematical model](engine-architecture-and-mathematics.md).

Product sources: [domain model](../product/domain-model.md), [technology catalog](../product/technology-catalog.md), [index](../product/balance/index.md), [repository boundaries](../product/repository-boundaries.md).

## Proposed PR sequence

These are outcome-sized slices. They landed on one PR ([#101](https://github.com/movahedan/fivenines/pull/101)); #66 is still open on that branch.

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
| Catalog and identity foundations | Folded into #101 | [#102](https://github.com/movahedan/fivenines/pull/102) closed into #101 | `IdentityRegistry` + `assertHourIndex`; no catalog compiler. `src/baseline/` remains the JSON checker. Live SKUs stay Bronze. `Game` unwired. |
| Project services and shared assets | Folded into #101 | [#103](https://github.com/movahedan/fivenines/pull/103) closed into #101 | `TopologyGraph` services/instances/shared assets; `Game` unwired. |
| Application model integration | Planned | [#101](https://github.com/movahedan/fivenines/pull/101) | Issue [#66](https://github.com/movahedan/fivenines/issues/66). Remaining work on the Milestone 2 PR. |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

## Catalog cutover (durable)

Do not compile `baseline.json` into a parallel runtime catalog. Live numbers stay in `packages/fivenines-engine/src/catalog/*.ts`. The authored JSON stays a design pack plus the M1 checker. When Opening Shift / Bronze are replaced, write the new integers into those modules or a single versioned runtime snapshot — one boot source, no translator object.

# Infrastructure engine and interface integration

Milestone 5.2. Status: first slice in progress, stacked on open [#135](https://github.com/movahedan/fivenines/pull/135) by assignment (M5.1 not yet merged). Follow the [delivery workflow](README.md).

GitHub: [M5.2](https://github.com/movahedan/fivenines/milestone/12).

## Outcome and boundaries

Complete explicitly scoped M1–M5 follow-ups and connect the designed UI to real behavior before M6 starts. Audit existing work first; reuse ownership, mathematics, queue and ledger. No parallel engine, Terraform or pull-forward of M8 balancing.

Product sources: [editor](../product/infrastructure-editor.md), [interface brief](../product/interface-design-brief.md), [interaction specification](../product/interaction-specification.md). Technical steps: [execution plan](../../.cursor/plans/infrastructure-editor-redesign.plan.md).

## Proposed PR sequence

| Slice | Depends on | Deliverable |
|---|---|---|
| Live placement and identity integration follow-up | M5.1 | Audit merged M2/M4/M5 and close actual live topology/instance/placement gaps with existing Game/allocator. Verify shared assets, same/split-host execution and accounting. Do not rewrite equations or implement balancers. |
| Proposal evaluation and eligible-target queries | Live placement and identity integration follow-up | Add pure domain evaluation of real plus proposed state, stable identities, valid targets, ambiguity, blockers and preparation requirements. Resolve mapping/acquisition contract first; preserve manual links and shared service settings. |
| Apply and automatic preparation | Proposal evaluation and eligible-target queries | Implement validated apply, dependency-aware automatic work in existing queue, warning-approved unconfigured/off installation, and longer preparation after numerical validation. Preserve skills, data, explicit contract activation and ledger. |
| Live editor integration and commercial regression | Apply and automatic preparation | Replace relevant fixture/unsupported setup paths with verified engine APIs; wire Requirements, both Add paths, warnings, queue/progress and apply/discard. Test first contract through settlement, incremental edits, shared hosts, invalidated proposals and desktop/mobile. Full hosted balancing remains M8. |

## Implementation walkthrough (for joint review)

Before each engine PR, show the developer a compact comparison of current behavior, proposed change, reused modules and the scenario proving it. Resolve material model/API changes before dependent implementation; routine fixes and agreed steps do not need repeated permission. Preserve historical M1–M5 evidence. These steps are a roadmap, not proof of missing or completed code.

### 1. Audit and close actual integration gaps — #130

1. Trace one existing project from setup through host placement, queue, execution and settlement in merged code. Compare that path to M2/M4/M5 acceptance and existing tests.
2. Present the actual gaps and smallest changes. Reuse integrated foundations; if a suspected gap is already fixed, remove that work from the PR.
3. Connect only missing service/instance/host relationships to the existing Game and allocator, then test same-host/split-host and shared-host cases.

**Review together:** the gap map and any ownership/model change before editing the core. **Result:** verified live placement without a second graph owner or formula rewrite.

### 2. Let the engine evaluate a proposed edit — #131

1. Agree a small input/output example: current project plus an added application should expose eligible payment targets without installing anything.
2. Define proposed entity IDs, eligible targets, ambiguity, blockers and required preparation; leave geometry and visual ordering to the UI.
3. Implement a pure query over actual plus proposed state and test that money, clock, RNG, identities and queue do not change.

**Review together:** the API example and mapping of drawn server links to domain relations. **Result:** one authoritative source for placement decisions, usable by both click and drag.

### 3. Apply changes through the existing work queue — #132

1. Settle acquisition/charges, rejection semantics and runnable-versus-blocked work with concrete scenarios. Do not assume a warning dialog defines a transaction policy.
2. Validate at apply and enqueue installation/configuration in dependency order; preserve progress/cancellation and shared settings.
3. Validate longer preparation values against skills, patience and first-project affordability before changing catalogs. Keep ready software and activated contract separate.
4. Test repeated submissions, stale funds/targets, warning-approved unconfigured installation and changes to a running project.

**Review together:** apply behavior and before/after timing evidence, including proposed numerical values. **Result:** real automatic preparation without premature success or surprise charges.

### 4. Connect the designed interface and verify the complete path — #133

1. Replace relevant visual-only adapters with the verified queries/commands, retaining one project-owned unapplied state.
2. Feed Requirements, pickers, warning modal, software rows and checklist from actual results; remove only the production restrictions whose capabilities now exist.
3. Play acceptance through setup, explicit activation and settlement on desktop/mobile, then an incremental change on shared infrastructure.

**Review together:** the working journey and remaining later-milestone empty states. **Result:** M5.2 completion evidence before M6; hosted balancing still waits for M8.

## Acceptance and verification

- Pure proposal queries change no cash, time, RNG, IDs or tasks. Apply starts only real supported work; rejected proposals retain edits and use warning UI.
- Install/configure readiness remains separate from explicit project activation; longer preparation remains affordable and consistent with setup patience after documented numerical decisions.
- Verify real host placement/resource accounting, existing skill effects, no duplicate charges/tasks, first settlement and incremental UI edits on both devices.
- Each engine PR runs `bun test packages/fivenines-engine`, `bun run turbo run typecheck --filter=@packages/fivenines-engine`, then `bun run overall`; integration also runs affected UI/web tests and browser journeys.

## Delivery record

| Slice | Status | Issue | PR/evidence |
|---|---|---|---|
| Live placement and identity integration follow-up | In progress (stacked on #135) | [#130](https://github.com/movahedan/fivenines/issues/130) | Audit: live `RouteTarget` placement already covers same-host / split-host / shared opex. F1 binds `startProject` to `setupServerId` when set; does not import topology/identity into Game. |
| Proposal evaluation and eligible-target queries | Planned | [#131](https://github.com/movahedan/fivenines/issues/131) | Not implemented |
| Apply and automatic preparation | Planned | [#132](https://github.com/movahedan/fivenines/issues/132) | Not implemented |
| Live editor integration and commercial regression | Planned | [#133](https://github.com/movahedan/fivenines/issues/133) | Not implemented |

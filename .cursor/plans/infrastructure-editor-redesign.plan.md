---
name: Game interface design and milestone integration
overview: "Define the complete desktop/mobile interface now; deliver reusable visual components without changing the engine roadmap, and integrate behavior in its owning milestone."
todos:
  - id: product-map
    content: "P1: Reconcile interview decisions and produce a screen/state/milestone map"
    status: pending
  - id: shell-design
    content: "P2: Build native-compatible game-template, destination slots and responsive visual states"
    status: pending
  - id: editor-design
    content: "P3: Build isolated React Flow and setup interaction stories against fixture data"
    status: pending
  - id: existing-integration
    content: "P4: Connect supported existing behavior and leave future surfaces honestly empty"
    status: pending
  - id: foundation-followups
    content: "M5.2: Complete F1–F3 and live UI integration after M5.1 merges"
    status: pending
  - id: milestone-followthrough
    content: "Integrate future behavior through the existing milestone owners, not a parallel engine initiative"
    status: pending
isProject: false
---

# Game interface design and milestone integration

## Revised delivery contract

The latest approved sequence is **M5 → M5.1 → M5.2 → M6 onward**. [M5.1](../../docs/milestones/interface-design-and-documentation.md) owns P1/P2/P3 and unchanged-API visual integration from P4, with no engine source/tests/API/catalog or balance-number changes. [M5.2](../../docs/milestones/infrastructure-engine-and-interface-integration.md) owns F1/F2/F3 and the new live setup integration from P4. Complete and merge M5.1 before M5.2; complete M5.2 before M6. This supersedes the former concurrent visual/engine bridge. Each milestone owns its issue/PR sequence; this technical plan supplies implementation steps.

## Documentation execution record

The product editor contract, delivery bridge, product cross-references and amendments to all ten milestone documents are included in this documentation change. Their merge status is tracked by the PR. P1 remains pending for closure of the explicitly listed semantic decisions and merged-state audit; do not interpret this as engine implementation.

## Current-code evidence and constraints

The current `packages/fivenines-engine/src/project.ts` uses a single server route and fixed first-project setup fields. `src/topology/graph.ts` has service/instance identities but is not integrated into the live Game. The redesign must not turn that discovery into an independently scheduled engine migration. M4/M5 follow-up work and future consumers need coordination against the actual merged engine plans.

The user reports M1–M5 merged; some local records are stale. Verify merged state before implementation and preserve actual delivery history. Existing `apps/web/src/hub` integrates Game; `packages/ui` provides native-compatible components; the immutable Figma source is in `apps/figma-design`.

## P1 — Product reconciliation and complete placement map

**Outcome:** show exactly where every section belongs on desktop/mobile, its states, existing data source and future milestone owner before building components. Documentation-only PR, no engine changes.

Create `docs/product/infrastructure-editor.md` for the agreed interaction contract. Reconcile `interface-design-brief.md`, `interaction-specification.md`, `gameplay.md`, `domain-model.md`, `repository-boundaries.md`, `technology-catalog.md`, `index.md` and `figma-make-handoff.md` as relevant. Superseded visual rules (universal rack reuse, manual rack movement, manual per-row Config) must not remain active instructions. Do not introduce numerical tuning or new engine APIs merely through prose.

Add a delivery map to `docs/milestones/README.md` and scoped updates to M6–M10. A small bridge coordination document may track UI PRs, but must not become another engine roadmap or renumber the milestones. Preserve M4/M5 history and list any discovered follow-up dependency explicitly.

### Screen and section placement map

| Section | Desktop | Mobile | Build now | Runtime owner/dependency |
|---|---|---|---|---|
| Global status, Operations, Learning progress | Top bar | Top bar plus progress strip above navigation | Full template/states; supported data only | Existing engine; future task kinds extend with their milestones |
| Projects | Left collapsible panel | Projects destination | Full list/selection/empty layout | Current project data; M6 offer/relationship expansion |
| New project and Contract Review | Central pages | Active content pages | Full layout and supported acceptance | Existing acceptance; M6 expanded terms |
| Contract | Collapsed section at top of project | Same vertical order | Real available terms | M6 remaining obligations |
| Requirements | Horizontal row after Contract | Same, touch/click placement | Visual component and isolated placement stories | Generalized requirement/target queries assigned through owner audit below |
| Infrastructure | Central project section | Contained pan/zoom section | React Flow visual component with fixture scenarios | Current projections only where accurate; generalized placement/links require engine follow-up |
| Setup checklist | Below infrastructure, remains available | Same section outside graph | All progress/blocker/empty states | Current queue where exact; automatic setup dependency assigned through M6 prerequisite review |
| Project status/performance/finances | Tabs below infrastructure | Same embedded tabs | Full tab layout; truthful current/empty content | M6 commercial details; M7 observed history |
| Inventory | Right destination panel | Inventory destination | Compact assets and supported actions, not editor rack reuse | Existing asset operations; M7 recovery |
| Learning | Right destination panel | Learning destination | Current enrollment, future capability states | Existing learning; M9 coverage closure |
| Business finances | Right destination panel | Finances destination | Current data and complete empty layout | M6 ledger/relationships |
| Activity | Shell right overlay | Shell overlay | Shared event layout | Existing events; M6–M8 enrich with actual behavior |
| Object details and pickers | Bottom drawers | Bottom drawers | Shared components and state stories | Capability-specific milestone |
| Target placement | Temporary overlay on canvas | Large touch targets over canvas | Molecule, click/drag stories | Engine eligibility required before production placement |
| Load balancer | Small independent circular node | Same node | Fixture visual and unsupported production state | M8 routing, host/resources/targets |
| Monitoring/recovery/automation | Object details, checklist, status | Same contextual destinations | Designed empty/unavailable states | M7 observation/recovery; M8 automation |

## Scheduled engine follow-ups for M1–M5

These are explicit scheduled work, not deferred suggestions and not a new engine roadmap. Amend the existing milestone/PR plans in P1, preserving historical merged evidence. Distinguish an existing acceptance gap from behavior newly requested in this interview. Revalidate source and merged revisions before selecting exact edits; do not reimplement a foundation already integrated elsewhere.

**Timing:** complete and merge M5.1 first; then F1 → F2 → F3 in M5.2. Visual-only P2/P3 complete in M5.1 before F work because they consume display props/fixtures and do not edit engine rules. P4 may connect unchanged existing APIs earlier, but the new placement/setup path waits for F3. M6's generalized setup slice waits for F3; M6 implementation waits for M5.2. M6 begins after M5.2 completes; M7–M10 keep their established dependency order. This scheduling permission is not permission to spawn agents under the active delegation rules.

### Impact on each completed milestone

| Milestone | What changes or needs verification | Where and when |
|---|---|---|
| M1: architecture and mathematics | Retain one clock, tick ordering, existing resource equations and ledger. Validate that proposal queries have no simulation effects and changed placement preserves accounting. No formula rewrite requested. | F1 integration/regression, F2 purity, F3 final numerical gate |
| M2: entities and catalogs | Resolve remaining live service/instance/shared-asset integration; represent stable requirements and eligible targets using the same identities. Requirements order must not gate duplicate instances. | F1 live integration; F2 typed queries |
| M3: demand and learning foundations | Preserve cohorts, retained progress and learning lifecycle. Check existing deployment-automation effects against longer preparation; no Terraform or new research tree. | F1 demand regressions; F3 skill/timing tests |
| M4: installation, configuration and operations | Replace fixed per-click setup orchestration with proposed changes, automatic task discovery, dependency ordering and explicit apply. Keep shared settings, per-instance readiness, and explicit project activation. | F2 preview; F3 execution and policy |
| M5: allocation, transfers and settlement | Make placement changes feed actual execution; preserve transfer throughput, shared resource accounting, park behavior and contract settlement. Repeat first-project playtest with longer setup. | F1 real execution; F3 integration gate |

### F1 — Complete live placement and identity integration

**Classification:** primarily an existing M2/M4/M5 acceptance follow-up, subject to merged-state audit. **Surfaces:** engine `topology/graph.ts`, `identity/registry.ts`, `project.ts`, `server.ts`, `game.ts`, `game.utils.ts`, `allocation/place.ts`, projections and related tests.

1. Compare merged M2/M4/M5 acceptance and exact live consumers; identify the remaining single-host/fixed-install assumptions.
2. Integrate existing services/instances/placements into the authoritative Game graph where missing, with stable IDs and one ownership source.
3. Connect instance installation/readiness and shared service settings to actual hosts; do not copy the topology into a second graph.
4. Ensure same-host and split-host application/database execution consumes the existing allocator budgets and preserves roots/queues/data-transfer semantics. No load-balancer scope here.
5. Keep existing Hub/Lab operational with only necessary adapter repairs, then verify two projects sharing a host and multiple instances sharing settings without double cost/capacity.

**Acceptance:** same-host and split-host first-project execution, independent instance health, shared service configuration, correct shared-asset costs, no regression of park/transfer/settlement. If the audit shows integration already complete, shrink F1 to verification and only actual gaps; don't invent a new migration.

**Documentation before PR:** M2/M4/M5 follow-up rows with actual PR evidence, engine AGENTS and relevant existing technical plan. Original merged status/history is not rewritten.

### F2 — Read-only editor proposal and target contract

**Classification:** new interaction support on M2/M4 foundations. **Depends on F1** and P1 decisions about host-link semantics/acquisition. **Surfaces:** engine catalogs, public query exports, topology/placement interfaces and a narrowly scoped proposal module; exact API/file names require a detailed PR plan.

1. Define typed proposed additions/changes and temporary identity handling against real state, without React or coordinate types.
2. Evaluate contractual requirement items, eligible hosts/entities, ambiguity and missing-prerequisite explanations over real plus proposed state.
3. Infer compatible semantic relationships only after player-drawn host links where required; never auto-remove the manual connection step.
4. Produce required installation/configuration work and warnings without changing state, RNG, IDs, money, clock or queue.
5. Test application proposed before payment targeting, same-host automatic dependencies, invalid hardware/research/project, multiple valid targets and empty results. Future unsupported capability families remain explicitly unsupported and are extended in their milestones.

**Acceptance:** deterministic pure results, no duplicated domain eligibility in UI, no requirements-order lock, safe shared-settings semantics. This is preview state, not a second Game or new screen.

**Documentation before PR:** M2/M4 follow-up record, editor product contract/API references, engine AGENTS; M6–M9 query-consumer entries.

### F3 — Apply, automatic preparation and timing validation

**Classification:** new M4 interaction behavior plus M3/M5 regression and balance work. **Depends on F2** and P1 resolution of batch/warning/acquisition semantics. **Surfaces:** Game command boundary, `operations/queue.ts`, `catalog/operations-policy.ts`, relevant learning/finance policies and integration tests.

1. Validate proposed edits against current authoritative state; implement agreed failure/duplicate-submit semantics and preserve caller edits on rejection.
2. Enqueue installation/configuration automatically with prerequisites through the existing operational queue. No side effects before apply.
3. Permit warning-approved unconfigured installation to complete while remaining off; start eligible software after successful preparation, without starting the project's contract automatically.
4. Support subsequent edits to operating projects; retain unrelated work, shared configuration and normal cancellation/data/power rules.
5. Set longer authored preparation work using before/after scenarios, preserving automation-skill effects. Review patience/refunds/affordability explicitly; don't silently lengthen contract grace to hide a failed balance.
6. Export authoritative checklist/readiness/blocker data and distinguish initial Setup, Apply & Setup and Apply requirements for UI labeling.
7. Run accept → propose acquisition/placement → connect → apply → install/configure → explicit activation → demand → first settlement; include stale funds/targets, no eligible destination, ambiguity, discard, repeated submit and partial preparation.

**Acceptance:** real queue/progress and charges exactly follow the agreed policy; no phantom success, no contract activation from setup completion, no old five-hour baseline assertion left contradictory to new tuning. F3 gates the **new live editor setup path**, not visual design work.

**Documentation before PR:** M3 skill-effect verification, M4 new policy/acceptance (preserving historical baseline), M5 repeated playtest evidence, engine AGENTS, affected balance sources and M6 prerequisite link.

**Ordered engine gate for F1–F3:**

```bash
bun test packages/fivenines-engine
bun run turbo run typecheck --filter=@packages/fivenines-engine
bun run overall
```

Estimated F work is **two to three cohesive follow-up PRs**: combine F2/F3 only if transaction/query scope remains reviewable; split F1 only for demonstrated integration size. These are not four extra engine milestones. They are visible real work; do not remove them from estimates to make the UI initiative look smaller.

## Required amendments to future milestones — authored in P1

Edit the named milestone documents in P1, not when somebody eventually encounters the problem. Each gets revised prerequisites, proposed slice changes, UI slot references and acceptance scenarios. Implementation stays with its owning milestone.

| Milestone/document | Exact planning amendment | Still stays there | Integration acceptance |
|---|---|---|---|
| M6 `contracts-economy-and-growth.md` | Generalized acceptance/setup consumes F1–F3 instead of rebuilding a separate setup path. Declare F3 dependency for that slice. Map each offer's requirements to card IDs and supported placements; preserve payment/application distinction and initial activation boundary. | Contract families, obligations, ledger, relationships, recovery and offer growth | New contract appears in central review; correct required cards; advance once; longer preparation respects documented patience; billing starts only on explicit activation; finances fill existing slots |
| M7 `observation-incidents-and-recovery.md` | Extend F2 target/preparation contracts for coverage and recovery; specify monitoring install versus coverage, selected targets and dependency work. Use existing drawers/checklist, not a new inspector layout. | History, diagnosis, attribution, incidents, repair/restore/checkpoints | Coverage-aware data fills status/Performance; absent history remains unavailable; recovery uses actual tasks and compatible targets without revealing hidden causes |
| M8 `routing-and-automation.md` | Keep hosted load-balancer execution here (do not bring it forward into F1). Define round visual node with real host/resources, manual host/entity connections, direction inference and target ambiguity. Consume proposal/apply contracts; replace UI requirement for only source-menu Connect with drag plus retained alternative. | Basic/nested balancing, Health Checks, replication/failover, replacement and automatic leasing | Single host works without balancer; balancer accounted once; loops rejected; targets and observed health correct; ready automation fills already-designed slots |
| M9 `learning-and-technology-coverage.md` | Extend requirement classification and eligibility per v1 capability rather than treating every technology as identical software. Verify integrations, coverage, dependencies and optional additions. Reconcile longer preparation with existing skill effects. | Remaining real v1 capability/workload coverage and course consumers; not F1–F3 foundations | Each supported capability has a working Add/placement/detail route; research alone never installs; payment isn't a fictitious bank; no Terraform added |
| M10 `interface-and-game-validation.md` | Replace obsolete universal-rack/manual-layout expectations; point to completed P2/P3 design, P4 and milestone-specific integrations. Add requirements rotation, valid-only overlay, warning/apply/checklist and growing-rack scenarios on both devices. | Full campaign, balance, accessibility/performance and delivery closure | Every formerly empty v1 surface verified against real behavior; complete desktop/mobile flows and original campaign evidence; no fixture-based completion claims |

`docs/milestones/README.md` shows the explicit M5 → M5.1 → M5.2 → M6 sequence. F1–F3 and live setup integration belong to M5.2; no engine work is allowed in M5.1.

### Interview decisions to transpose into the product contract

These are reconciliation inputs, not a second permanent specification. Once D1 merges, replace this inventory with links to the authoritative sections.

- Preserved `apps/figma-design` is the visual reference. Follow overall layout and details exactly except explicit decisions in this interview. Consult the developer for new substantial layout changes or explicit product contradictions; do not add routine visual reapproval gates.
- Scope is the entire game, desktop and mobile together. Marketing, authentication pages and redesign of Lab are excluded. Future destinations get designed shells/empty states, no fake metrics or working controls for absent capabilities.
- `game-template` in `ui/templates` owns named section slots and their device-specific presentation: desktop sliding/collapsible panels versus mobile navigation destinations, not just outer header spacing.
- Editor in web named `infrastructure-editor`; component-first sibling folders `node-server`, `node-demand`, `node-load-balancer`, `edge-connection`. Server visual remains inside `node-server`, not a universal Inventory/acquisition rack.
- Software rows span the rack width; height grows with row count. File `node-server-software-row.tsx`. No internal graph/lines or nested React Flow. Show name, existing progress line, state text and status lamp; row opens bottom detail drawer. Ready software has power control. Manual Config workflow discussed earlier is superseded by automatic setup.
- Show only current-project software on a shared server; other-project indication navigates to that project. Defer aggregate cross-project software inspection/editing.
- Left-to-right auto-layout on both devices, pan/zoom contained in canvas, no manual rack movement. Structural/size changes can relayout; ticks/metrics/power/progress do not. Preserve camera and selection; no fit-on-every-update.
- Manual connections are between servers/independent graph entities, not software rows. Drag from body or clear anchors; infer valid direction/relations. Retain non-drag Connect alternative. Required missing links pulse gently until a valid proposed path exists; reduced-motion has a static cue. Do not auto-draw away this gameplay step.
- Load balancer is a small round independent visual node, software hosted on a real server consuming resources. No twin attached-balancer entities. Simple projects route Demand directly to Server. A visual duplicate reference must not double-count installation/resources.
- Requirements is a horizontal helper after Contract, before Infrastructure. One card per deployable requirement, not a bundle such as an entire shop. Click/tap activates placement; drag also works. A used card moves to the end, so missing needs rise naturally. It never locks duplicate instances; Add remains available from the beginning.
- Placement overlay shows only eligible large target areas, based on engine results. No eligible target: explain the missing prerequisite in that same area. Ambiguous application/dependency choices ask for a target, no arbitrary guessing.
- Server Add opens `pick-software` drawer, requirements first, host preselected. Add beside servers opens `pick-infrastructure` for independent entities. Optional capabilities use Add, not the contractual Requirements list.
- Payment card targets a server with a compatible application and resolves the application automatically when unambiguous. Coverage, replication and external integration are not all blindly modeled as installable software rows.
- One project-owned unsaved state feeds canvas, Requirements, pickers and checklist. No separate Draft screen or required draft-edge style. Preview/selection has no simulation/cash side effect. Warn on leaving with changes and offer apply/discard/stay.
- Primary label: first setup `Setup`; edits requiring preparation `Apply & Setup`; edits without preparation `Apply`; no-change state has no active apply action. Discard abandons only unapplied changes, not already-running work.
- Adding software discovers installation/configuration work automatically. Setup checklist remains and shows dependencies, queued/running/completed work, ticking only on real completion. Longer game preparation time, not artificial UI delay. Ready software may auto-start subject to genuine readiness; this is distinct from project service activation.
- Incomplete configuration may be applied with warning; installation may proceed but unconfigured software remains off. Invalid/stale apply uses the shared warning modal and preserves edits for correction.


## Deferred semantic decisions

Resolve in P1 before the affected F2/F3 implementation, while nondependent visual work can proceed: host-link mapping to semantic dependencies/shared service settings; batch rejection/partial mutation policy; purchase/lease timing and temporary identities; precise longer preparation work and setup patience; balancer host selection; blocked-versus-runnable setup tasks; power/removal scope in a pending proposal. Show these states with fixtures where necessary, label them as pending behavior decisions, and do not invent production defaults.

## Visual architecture and file boundaries

### Shared agreed file boundaries

```text
apps/web/src/infrastructure-editor/
  infrastructure-editor.tsx
  infrastructure-editor.types.ts
  use-infrastructure-editor.ts
  infrastructure-layout.ts
  infrastructure-projection.ts
  node-server/
    node-server.tsx
    node-server-software-row.tsx
  node-demand/
    node-demand.tsx
  node-load-balancer/
    node-load-balancer.tsx
  edge-connection/
    edge-connection.tsx

packages/ui/src/templates/game-template/
packages/ui/src/organisms/project-requirements/
packages/ui/src/organisms/project-setup-checklist/
packages/ui/src/organisms/pick-software/
packages/ui/src/organisms/pick-infrastructure/
packages/ui/src/organisms/object-details/
packages/ui/src/molecules/  # target-placement overlay, exact component name still to settle
```

Component-first folders; `pick-*` siblings sort together. Hook above owns adapter behavior, not the sole proposal state; that is owned above the editor in the project workspace. Preserve user consultation on material React Flow structure changes; do not silently create a generic framework or many manager modules. Layout and projection filenames are proposals from the interview, not immutable product requirements.


`game-template` receives named section slots and owns their different desktop/mobile presentation. Shared organisms/molecules take display props and callbacks, without engine/auth/React Flow imports. Project workspace owns unapplied state only once the supported integration exists. Web React Flow owns visual graph interactions, layout and camera; fixture examples can exercise these without a Game replica.

The target overlay is a molecule. Exact name remains to be agreed before creating it. `pick-software` and `pick-infrastructure` are agreed organism names. Preserve component-first node folders and consult the user on substantial file-structure changes, not routine implementation choices.

## P2 — Shared visual shell and all destination slots

**Surfaces:** `packages/ui/src/templates/game-template`, shared organisms/molecules, theme/export conventions and stories. Web composition only where existing behavior is unchanged.

**Implementation steps:**
1. Inventory preserved Figma layout/tokens and existing native primitives; record viewport baselines.
2. Define named slot/controlled-navigation props for left Projects, right business destinations, central content, progress and contextual overlays.
3. Build desktop rails/panels and mobile navigation with the same injected destination components.
4. Compose project Contract/Requirements/Infrastructure/checklist/status sections in their agreed order.
5. Add Storybook compositions for every destination, empty/busy states, drawers and long content; use fixture data only in stories.
6. Verify narrow mobile, intermediate/tablet and desktop, focus, touch, safe areas and scroll boundaries. Avoid theme regressions on marketing/auth.

**Acceptance:** complete visible placement map on both devices, no dependency on unfinished engine changes; no fake working business actions in the real game.

**Docs before PR:** UI AGENTS, Storybook guide, UI delivery record; update web AGENTS only for actual composition changes.

## P3 — Editor visuals and interaction design

**Surfaces:** `apps/web/src/infrastructure-editor`, web package/lockfile for `@xyflow/react` and selected auto-layout dependency; shared requirements, picker, checklist and target-overlay components and stories.

**Implementation steps:**
1. Agree final component/type boundary and target-overlay name using the established naming preferences.
2. Build variable-height server node/software rows, demand and round balancer nodes, visible edge anchors; no software subgraph.
3. Select and verify external automatic layout (React Flow has no built-in layout engine); maintain stable camera and structural-only relayout.
4. Build requirements click/drag placement using supplied eligible-target props; show valid targets only and an inline empty explanation.
5. Build both Add drawers, warning modal integration and checklist/row progress states.
6. Compose isolated scenarios for same-host/split-host, shared-host indication, ambiguity, missing prerequisite, changed/unchanged/initial button labels, pending/running/complete preparation and power states.
7. Verify mouse/touch/keyboard and reduced motion, without computing eligibility, costs or preparation work in UI.

**Acceptance:** visual/interaction review artifacts make the future experience concrete; unavailable engine behavior stays isolated in stories or development-only fixture previews. No fixture data or simulated success in production routes. No duplicated legacy full UI, second Game, or permanent demo mode.

**Docs before PR:** web/UI AGENTS, component map, fixture-vs-production boundary and delivery record.

## P4 — Connect supported behavior; retain designed future slots

**Surfaces:** `apps/web/src/hub/hub-session.tsx`, `use-hub-game.ts`, `hub-map.ts`, new web adapters and shared display components.

**Implementation steps:**
1. Inventory exact public Game commands/projections and match each to P1's capability map.
2. Wire existing offers, contract review, assets, learning, finance/status and navigation only where semantics match.
3. Render future destinations with honest empty/unsupported states; no misleading actionable placement or Apply controls.
4. If replacing a flow would remove existing working gameplay, keep its supported path usable or defer that route's cutover; do not smuggle in engine fixes to force the cutover.
5. Add meaningful regression tests for accepted-contract billing timing, current supported actions and absence of simulated success.
6. Record each remaining integration against its milestone and explicit component slot; remove obsolete code only after consumer verification.

**Acceptance:** supported behavior remains usable, complete design structure is visible, future behavior has an owner. Per-capability integration proceeds in later milestone PRs after its engine API is verified; no all-engine-before-all-UI gate.

**Docs before PR:** web/UI AGENTS, milestones' UI integration sections and remaining integration table.

## Verification and delivery sequence

For component-only work, use relevant UI tests and actual Storybook/browser visual inspection. For web integration, run in order:

```bash
bun test packages/ui
bun test apps/web packages/analytics
bun run turbo run build --filter=@apps/web
bun run --filter=@apps/web export:check
bun run overall
```

Visual checks: 360/390px mobile, intermediate width, 1280/1440px desktop; compare reference layout and interview-approved differences, including text spelling, spacing, node size, growing racks, drawer focus/scroll and empty states. RN-web verification is not proof of native app runtime; preserve native-compatible dependencies now, native application remains deferred.

| Proposed PR | Outcome | Dependency |
|---|---|---|
| P1 | Product/section/milestone reconciliation | Current roadmap inspection |
| F1–F3 | M1–M5 integration follow-ups, proposal queries and automatic setup | M5.1 merged, then F1 → F2 → F3 |
| P2 | Complete responsive template and visual slots | P1; part of M5.1 before F1–F3 |
| P3 | Editor and setup component stories | P1; compose with P2 |
| P4 | Supported runtime integration | Existing APIs for unchanged flows; F3 for new setup flow |

Each new milestone currently proposes four reviewable slices: M5.1 documentation/template/editor visuals/unchanged-API integration, then M5.2 live placement/queries/apply/live UI regression. Refine PR sizing against actual source; do not collapse the boundary between milestones to save a PR. M6 starts after M5.2. Routing remains M8.

## Risks and boundaries

- A visual proposal must not silently amend mathematical or operational rules; reconcile those with their existing owner.
- Keep fixture data in stories/development-only previews. Production states never fabricate metrics, eligibility, successful commands or functioning future features.
- A pure target-query contract is a future engine requirement, not permission to rebuild domain logic in the editor.
- Preserve `apps/figma-design/src` unchanged and unimported by production.
- No Terraform, native application, employees, away-time, server/SSE migration, marketing/auth redesign, manual rack dragging, internal rack graph, cross-project Inventory editing or full M6–M9 implementation in this initiative.
- No mandatory subagents. Apply normal builder → verification → documentation-sync → git/PR workflow only when execution is authorized.
- Before each implementation PR, prepare exact ordered code steps and meaningful test scenarios against then-current source. The phase steps above are a concrete starting point, not permission to invent missing product behavior.

## Plan artifact verification

Planning-only gate: `git diff --check` plus local Markdown link checks. No engine or UI implementation was changed and no runtime test results are claimed.

# Interface design and documentation

Milestone 5.1. Status: planned; no implementation PR is claimed delivered. Prerequisite: **M5 completed and merged**. Follow the [delivery workflow](README.md).

GitHub: [M5.1](https://github.com/movahedan/fivenines/milestone/11).

## Outcome and boundaries

Deliver the approved desktop/mobile game design and documents without changing the engine. Fixture interactions stay in development stories; production consumes only unchanged supported APIs or honest empty states. No engine source/tests/catalog/API or balance-number changes.

Product sources: [editor](../product/infrastructure-editor.md), [interface brief](../product/interface-design-brief.md), [interaction specification](../product/interaction-specification.md). Technical steps: [execution plan](../../.cursor/plans/infrastructure-editor-redesign.plan.md).

## Proposed PR sequence

| Slice | Depends on | Deliverable |
|---|---|---|
| Product decisions and milestone reconciliation | M5 | Reconcile the approved editor contract, unresolved decisions and amendments to M1–M10. Define screen/state ownership and preserve historical evidence. No engine or numeric policy changes. |
| Responsive game template and destination slots | Product decisions and milestone reconciliation | Build native-compatible game-template with named desktop panel/mobile navigation slots and full desktop/mobile visual states. Keep engine/auth out of shared UI. |
| Infrastructure editor and setup interaction design | Responsive game template and destination slots | Build React Flow nodes, automatic layout, Requirements, pick-software/pick-infrastructure, valid-target overlay molecule and setup/checklist stories using isolated fixtures. No engine mutations or UI-local domain rules. |
| Existing behavior integration and visual acceptance | Infrastructure editor and setup interaction design | Wire only supported unchanged engine APIs, preserve working gameplay, show honest empty future states, and verify desktop/mobile against the reference. No changes to engine source, tests, catalog or public API. |

## Implementation walkthrough (for joint review)

These short steps explain the intended approach; the assigned PR still needs a current-code plan. The developer reviews material structure/behavior choices before dependent implementation, not the already-approved Figma appearance again. Keep a brief update at the start of each PR (scope and unresolved decisions) and at delivery (visible result, checks and remaining limitations). Do not merge merely because these steps exist.

### 1. Document and map the sections — #126

1. Map every Figma section to its desktop slot and mobile destination, using the editor contract for approved changes.
2. Mark each section as existing behavior, visual-only future behavior, or a specific M5.2/M6–M10 integration dependency.
3. Reconcile contradictory instructions and record unresolved engine questions without inventing answers.

**Review together:** the section/ownership map and remaining questions. **Result:** a concrete map that the component work follows.

### 2. Build the shared template — #127

1. Define `game-template` named content slots and controlled navigation/panel inputs before implementing it.
2. Build native-compatible desktop panels and mobile navigation around the same supplied section components. Business state stays in web; the template owns responsive placement, not engine behavior.
3. Compose empty/populated/drawer states in Storybook and check spacing, safe areas, scrolling and focus on both devices.

**Review together:** exact slot names, component boundaries, and who owns opening/closing panels. This is an API/structure review, not a fresh design approval. **Result:** a browsable complete shell, independent of the engine.

### 3. Build the editor components — #128

1. Confirm the component-first `infrastructure-editor` tree, `node-server`/software row, `node-demand`, `node-load-balancer` and connection edge responsibilities.
2. Implement variable-height rack visuals and external automatic layout; keep graph positions/camera separate from domain state. Choose and document the layout library after testing representative racks.
3. Build Requirements, `pick-software`, `pick-infrastructure`, the target-overlay molecule and checklist from supplied display data/callbacks.
4. Exercise click/drag, visible anchors, empty targets, ambiguity and preparation states with isolated fixtures. No compatibility solver or simulated Game in the UI.

**Review together:** final filenames, component props, fixture boundary and layout/gesture behavior before those contracts are fixed. **Result:** an interactive design preview, explicitly not working engine functionality.

### 4. Connect only current capabilities — #129

1. Match existing public engine data/commands to the components; make the adapter mapping visible in the PR plan.
2. Connect exact supported behavior; retain honest empty/unavailable states for the rest. Defer a route cutover if it would remove working gameplay or require engine changes.
3. Verify current journeys and side-by-side desktop/mobile visual fidelity. Record each remaining connection for M5.2 or its later milestone.

**Review together:** what will work in the actual game at the end of 5.1 versus what is only in the preview. **Result:** usable existing behavior inside the new design, without changing engine semantics.

## Acceptance and verification

- Complete shell/section placements, software rows, round balancer visual and contextual drawers on desktop/mobile, including empty/blocked/progress states.
- Keep all engine behavior unchanged; production must not fake new setup, eligibility or balancing.
- Verify reference fidelity, spelling, touch/keyboard/focus/scroll and reduced motion.
- Run affected UI/web tests, web build/export check and `bun run overall`; documentation-only PR uses link checks and `git diff --check`.

## Delivery record

| Slice | Status | Issue | PR/evidence |
|---|---|---|---|
| Product decisions and milestone reconciliation | Planned | [#126](https://github.com/movahedan/fivenines/issues/126) | Not implemented |
| Responsive game template and destination slots | Planned | [#127](https://github.com/movahedan/fivenines/issues/127) | Not implemented |
| Infrastructure editor and setup interaction design | Planned | [#128](https://github.com/movahedan/fivenines/issues/128) | Not implemented |
| Existing behavior integration and visual acceptance | Planned | [#129](https://github.com/movahedan/fivenines/issues/129) | Not implemented |

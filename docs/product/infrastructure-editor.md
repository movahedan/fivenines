# Infrastructure editor

Status: approved interaction direction from the September 2026 design interview; implementation is tracked in the [interface delivery bridge](../milestones/infrastructure-editor-and-interface-redesign.md). This document specifies intended behavior, not shipped engine support. Read with [Gameplay](gameplay.md), the [interface brief](interface-design-brief.md), and [interaction specification](interaction-specification.md).

## Project workspace and requirements

Preserve the repository Figma reference's desktop/mobile shell and details except the explicitly approved changes here. Desktop/mobile destination ownership is in the [game shell map](game-shell.md). The project contains Contract, a horizontal Requirements strip, Infrastructure, the persistent Setup checklist and the appropriate project-status content. Status, Performance and Finances remain tabs beneath Infrastructure. Completing setup does not remove access to the checklist.

Requirements contains one card per required component or integration, rather than an entire workload bundle. Click/tap activates target selection; dragging is also supported. A used card moves to the end, keeping unmet requirements near the front. The strip is a convenience, never an eligibility gate: Add and additional instances are available from the beginning where domain rules permit.

During placement, a temporary overlay on the canvas exposes large valid drop/select targets only. With no valid target, explain the missing prerequisite in the same area. Do not show a collection of invalid destinations. Ambiguous valid choices require selection rather than guessing. The engine supplies eligibility using the actual state and proposed additions; the interface determines geometry and gestures.

Add inside a server opens a bottom software picker with the host already selected and required items first. Add beside servers opens the infrastructure picker for servers, load balancers and other supported independent entities. Optional capabilities are accessed through Add rather than mixed into contractual Requirements.

## Racks, software and connections

Each server is a rack containing full-width thin software rows for the current project. Height grows with its contents. There is no internal dependency drawing or nested graph. Each row shows its name, state text, status lamp and progress line; selecting its body opens the bottom detail drawer. Ready software exposes power control. Other hosted projects are indicated with navigation to their project; aggregate cross-project software editing is deferred.

The editor rack visual belongs to the web server node. Inventory and acquisition use compact context-appropriate representations; they are not required to reuse the whole rack.

Layout is automatic, left-to-right on desktop and mobile. Manual node movement is deferred. Structural and size changes may relayout; metrics, power and task-progress updates must not move nodes. Preserve camera/selection and contain pan/zoom inside Infrastructure.

Players draw links between servers and independently represented entities, not software rows. Visible anchors mark entry/exit and dragging from the body also works. Determine valid relationship direction automatically. Keep the existing select-source/Connect/select-target alternative. A required missing connection makes its anchor pulse gently; stop once a valid proposed link exists. Respect reduced motion with a static indication. Do not automatically draw away this manual connection step.

A load balancer is a small round independent node representing software hosted on a real server, consuming that host's resources once. It is not two entities attached to server sides. One-server projects may connect Demand directly to Server. Host selection and semantic mapping of drawn host links are integration decisions listed in [Open questions](open-questions.md); no arbitrary routing or shared-configuration override is implied.

## One unapplied project state

The project workspace owns one set of proposed changes shared by the canvas, Requirements, pickers and checklist. This is not a separate Draft screen or a mandated visual style for edges. Adding software can immediately prepare its configuration before applying. Preview and discard do not start simulation work or charges.

The primary action is `Setup` for initial setup, `Apply & Setup` for subsequent changes requiring preparation, and `Apply` for changes not requiring preparation. With no changes there is no enabled apply action. Discard removes unapplied changes only. Leaving with changes offers apply, discard or staying in the editor. Apply failures use the common warning modal and retain edits for correction.

Required installation/configuration work is discovered automatically; individual manual Config clicks are no longer the normal setup workflow. Applying dispatches real preparation through the operational queue. The checklist shows prerequisite waiting, queued, running and completed states and ticks only after actual completion. Unconfigured installation is allowed after warning, but remains off. Successful preparation can start ready software; it must not silently activate the project contract or its billing clock.

Preparation should take longer in simulation time than the existing first-project policy, without artificial UI delay. Exact work values and interaction with contract patience require numerical validation before changing catalogs. Existing deployment-automation effects remain; no Terraform technology is introduced.

## Requirement semantics and engine boundary

Software, external integrations and coverage are distinct. A payment requirement targets a server containing a compatible application; resolve that application automatically only when unambiguous. This configures an external integration, not a player-owned payment processor. Monitoring has a host and project-specific coverage. Replication needs distinct roles and valid destinations; the common card appearance does not flatten these rules into generic installation.

Eligibility and preparation planning must be domain queries over current and proposed state, with no mutation, RNG use or time advancement. Return stable entity identities, valid choices, blockers and required work; no React Flow coordinates. Revalidate at apply. Exact batch failure, acquisition and partial-preparation semantics remain explicit open decisions, not defaults inferred by the UI.

## Delivery boundary

Shared visual components and isolated fixture stories can be built before engine integration. Production uses real supported data or honest empty/unavailable states; fixture interaction success never masquerades as a running capability. Follow-up work on milestones 1–5 is explicit in the delivery bridge, and later capabilities remain owned by milestones 6–10.

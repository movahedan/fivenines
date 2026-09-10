# Interface completion and game validation

Milestone 10 of 10. Status: planned; no implementation PR is claimed delivered. Follow the [standing delivery workflow](README.md).

## Outcome and boundaries

Finish the already integrated desktop/mobile experience and establish evidence that the complete business simulation is coherent, usable and balanced over extended play.

Balance changes require repeatable before/after evidence and catalog updates. Tests passing alone are not proof of fun or usability: record manual gameplay findings and remaining limitations alongside numerical results.

## Prerequisites and sources

[Complete learning and catalog coverage](learning-and-technology-coverage.md); all earlier milestone acceptance criteria must be integrated.

Product sources: [interface design brief](../product/interface-design-brief.md), [interaction specification](../product/interaction-specification.md), [figma make handoff](../product/figma-make-handoff.md), [product direction](../product/product-direction.md), [validation](../product/balance/validation.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Interaction completeness and accessibility | Milestone prerequisite | Audit implemented Figma journeys, action states and information hierarchy across Projects, Inventory, Learning and Finances. Repair touch, keyboard, focus, drawer and rail behavior. |
| Extended campaign and balance validation | Interaction completeness and accessibility | Run seeded multi-cycle healthy, overloaded and recovery campaigns across workload families. Reconcile execution/obligations/ledger/history and tune isolated policy values with documented evidence. |
| Performance and delivery closure | Extended campaign and balance validation | Profile representative and stress fleets, bounded history, cohort growth, graph invalidation and rendering on target viewports/devices. Fix bottlenecks and retire remaining obsolete runtime assumptions and completed temporary plans. |

## Acceptance and verification

- Mobile has five bottom-bar items: Projects, Inventory, the central New project action, Learning, and Finances. The four destinations switch views; New project opens the offer page, and acceptance happens only after full Contract Review; Back retains the selected offer. Desktop uses resizable/collapsible Projects on the left and one business destination on the right. Project Contract/Infrastructure/Setup or Project status sections and desktop top-bar/mobile-strip progress follow the approved design. Acquisition and impact drawers retain their own scroll/gesture rules.
- Object inspectors use bottom drawers on both devices; checklist actions and recovery reach the same context. Connections work through source selection, Connect and compatible destination selection without required drag. Account menus expose only functional defined actions; Profile and What’s new remain omitted.
- At narrow mobile widths, contain infrastructure pan/zoom within its canvas and keep surrounding pages and headers within the viewport; task progress and safe areas do not obscure navigation. Verify contrast, keyboard focus/return, chart point access and reduced motion with actual components, not merely the export.
- Server visuals in project, Inventory, acquisition and details consistently reuse the main workspace rack design.
- System rack, modules, balancers and asset actions preserve hierarchy and shared-project impact. Pending/rejected/disabled/destructive states remain understandable without hover.
- The first-project then two-project multi-cycle validation flow succeeds under an attainable strategy, while overload and missing recovery can produce the intended losses and customer departure.
- Charts, period summaries and debit/credit records reconcile with authoritative outcomes. Missing monitoring remains visibly missing; no presentation layer computes alternative economics.
- Record seed, duration, workload mix, device/runtime, fleet size and measured tick/render/memory results. Establish explicit performance budgets from target-device measurements before accepting optimization claims.
- All milestone delivery records identify merged PRs and integration evidence. Deferred employees, away-time and Nest/SSE remain explicitly deferred, not silently claimed delivered.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

This is completion and validation of UI delivered throughout the roadmap, not the first UI milestone. Figma-generated source remains preserved in the isolated reference application; shared production components preserve the mobile path. It is not evidence that missing controls or fixtures are production-ready. Native interaction validation does not imply mobile store publication.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Interaction completeness and accessibility | Planned | — | Not run |
| Extended campaign and balance validation | Planned | — | Not run |
| Performance and delivery closure | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.

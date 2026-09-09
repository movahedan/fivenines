# Interface design brief

Status: consolidated design direction, 2026-09-09. Navigation, shared drawers, project workspace behavior, and delegated interaction hierarchy are settled for design handoff. Fine visual treatments remain designer choices within these constraints. This document does not replace gameplay rules or claim runtime completion.

## Design objective

Make running an infrastructure business tangible: accept a customer's contract, assemble and prepare their system, observe demand, improve reliability, and understand the commercial consequences. The project infrastructure is the main play surface. Customers own their applications and business outcomes.

Preserve the existing dark operations-console identity while making the system itself visually engaging. Servers, installed software, visible preparation progress, customer reactions, and changing traffic provide the game character. Spline is set aside. Physical facility construction, rack space, cooling layouts, and cable installation are not implied by rack-shaped server artwork.

## Evidence and inspiration

Research used official descriptions and published visual material, not hands-on playtesting. The takeaways are design interpretations, not claims that another game implements Five Nines rules.

| Reference | Relevant observation | Proposed application |
|---|---|---|
| [Startup Company](https://store.steampowered.com/app/606800/Startup_Company/) | A software-business simulation with website features, employees, and hosting growth; its store gallery presents the business spatially | Make operational growth visible. Borrow contextual management, while retaining our customer's ownership of the application |
| [Software Inc.](https://store.steampowered.com/app/362620/Software_Inc/) | Software-company management with organizational growth | A secondary reference for future employee and business-management screens; employee mechanics remain deferred |
| [Factorio statistics GUI](https://direct.factorio.com/blog/post/fff-337) | Published screenshots combine production/consumption graphs, time ranges, summaries, and searchable breakdowns | Pair demand with completed work, then explain the bottleneck. Share the time range and search scope across related information |
| [Mini Motorways](https://dinopoloclub.com/games/mini-motorways/) | A readable growing road network; available on touch devices as well as desktop/console | Strong silhouettes and clear connections. Use restrained aggregate traffic animation, without simulating a visible particle for every request |
| [InfraSpace](https://store.steampowered.com/app/1511460/InfraSpace/) | Production depends on transportation and connected supply chains | Make dependencies and downstream effects inspectable. Do not import its individual-vehicle simulation into the aggregate demand engine |
| [COLD AISLE: Data Center Tycoon](https://store.steampowered.com/app/5036820) | Official listing describes servers, GPUs, capacity, SLAs, and customers; the inspected listing says Coming Soon | A close thematic reference, not a validated usability benchmark. Its first-person facility operations and proprietary AI products are outside our agreed scope |

## Current interface assessment

Inspected the worktree's `apps/web/src/hub/hub-session.tsx`, shared server-card source, and theme tokens. Visually inspected the running Storybook server card. The running `/hub` redirected to sign-in; an authenticated end-to-end session was not inspected. The running Storybook includes variants beyond this worktree's server-card implementation, so runtime and worktree are not assumed identical.

The source hub places Incoming, Active, Fleet, and Market together beneath a HUD, with a bounded event log. Its fixed minimum desktop width does not define the future mobile layout. Existing server cards already provide compact resource bars and a recognizable dark navy/green identity. Preserve this visual continuity, but introduce project workspaces and responsive navigation.

Existing example labels such as `1000 cores` must not become authoritative hardware specifications. Some secondary text is visually subdued; test readability at actual mobile size before carrying its treatment forward. Existing direct assignment, jail, and Opening Shift behavior must not be copied into the new product design.

## Established product constraints

- All interface copy, component names, and handoff documentation are English. Use familiar terms: Projects, Inventory, Technologies, Courses, Finances, Activity.
- Gameplay requires login. The current browser engine is a development arrangement; the intended authority is the server, delivering state through SSE.
- A project opens onto its infrastructure. Desktop keeps Status, Performance, and Finances in a right-side tabbed panel. Mobile uses separate project views. Component details use the desktop panel or a mobile bottom sheet.
- Each server has a rack-shaped visual container with the current project's software inside and a brief resource summary underneath. Shared hardware retains one identity, capacity budget, and cost across project views.
- Inventory is an alternative way to manage those same assets. Routine acquisition and placement can be completed inside a project.
- Basic server state and compact consumption remain visible. Detailed monitoring, error history, diagnosis, and alerts depend on installed, operating coverage. Missing observations remain missing.
- Never generate a special alert announcing that Monitoring itself is down. A down server remains visibly red; the player notices unavailable monitoring through ordinary status and history views.
- Contracts must be visibly contractual before acceptance, with important terms bold. Acceptance collects the advance; service activation follows preparation. Do not imply that acceptance immediately starts live service.
- Resource shares and healthy routing follow engine policy. Do not add priority sliders, routing algorithms, retries, or subtick controls.
- Keep exact economy values and technology dependencies in the balance/catalog sources. UI examples are not an alternative policy catalog.

## Agreed navigation and persistent context

Use Projects as the default destination. Desktop navigation: Projects, Inventory, Learning, Finances. Learning contains Technologies and Courses; Finances here is the business-wide view, distinct from project finances. Activity opens a shared feed from the shell. Settings and account stay secondary. Employee navigation is deferred with its feature.

On mobile, use a tab view with bottom navigation ordered Projects, Inventory, a prominent central New project action, Learning, and Finances. On desktop, the four destinations use collapsible and expandable folder-like rail panels with vertically labeled tabs. Keep a top status bar on both devices. The New project action opens available offers; it does not generate a new offer or accept a contract immediately.

Keep Operations progress floating on the left of the active content and Learning progress on the right. Operations includes installation, configuration, repair, migration, and automated replacement; Learning represents the two shared technology/course slots. Use compact collapsible indicators so these groups do not obscure the system or compete with the project inspector. Activity remains the event history rather than a permanent stack of event cards.

A project header means the compact identity strip within an already opened project workspace: project/customer name, service state, and access to its existing contract. It is not the offer-selection surface, a separate navigation step, or a substitute for full pre-acceptance details. Its exact visual treatment is a designer choice; no additional navigation step is required.

## Shared bottom drawers and offer review

New project opens an available-project list in a bottom drawer on both mobile and desktop. Selecting an offer reveals its full details within that drawer, including customer context, workload/features, requirements, and all contract terms. Provide a back action to the offer list that preserves its scroll position. Acceptance is an explicit action after review, with important contractual terms bold; the drawer provides the contractual modal surface without requiring another stacked modal. On acceptance, receive the advance and enter the project's setup workspace.

Bottom-drawer flows use the same content hierarchy and up/down interaction semantics on both devices; do not replace the desktop version with a centered dialog or side drawer. Dimensions may adapt to available space. Keep existing contextual desktop inspectors where already specified; this rule aligns flows that use bottom drawers rather than moving every panel into one.

Horizontal and vertical scrolling retain the same meaning across devices. Mobile bottom tabs and desktop rail panels are the primary navigation distinction. Proposed gesture detail: drag the drawer handle to expand/collapse, scroll its body to read, and provide visible close/back controls plus keyboard access. Scrolling contract text must not accidentally dismiss the drawer, and gestures must never accept a contract. Exact snap positions and gesture thresholds remain implementation details.

Keep cash, business reputation, game time, and pause/speed reachable in the shell. Receivables, liabilities, relationship details, and all resource totals need not be permanent HUD counters. Show operational preparation separately from the two shared learning slots. A compact task indicator opens the work queue; it is not another full-time panel.

## Required screen coverage

| Surface | Main content | Main action or transition |
|---|---|---|
| Projects | Customer identity, project/workload type, state, required SLA, short trend, and an actionable status summary | Open project; view available offers |
| Offers | A small reputation-appropriate selection with customer context, features, required technologies, and commercial summary | Review contract |
| Contract review | Bold advance, recurring/usage terms, setup cancellation/refund consequences, service obligations, and compensation | Accept contract and receive advance |
| Project setup | The same infrastructure canvas used after launch, with a contextual requirements checklist and preparation progress | Acquire capacity, install/configure required services, then Start service |
| Live infrastructure | Rack containers, project software, routing, selected component inspector, and concise resource/status cues | Inspect, configure, duplicate project deployment, migrate, repair, or manage capacity |
| Inventory | Owned/leased assets, region, condition, occupancy, current costs, and affected projects | Inspect asset; acquire, power off, repair, sell, or release where applicable |
| Technologies | Searchable families, prerequisites, unlocked project features, and research status | Learn a technology or inspect what blocks it |
| Courses | Five recognizable skill families, completed levels, effects, tuition, and duration | Enroll within the shared two-slot limit |
| Business finances | Cash history, receivables/payables, costs, upcoming collections/payments, and project contributions | Understand obligations and reach their project or asset |
| Activity | Grouped customer, operational, financial, and research events | Open the affected project/component or related record |

The first project should feel personal: an acquaintance's simple appointment-booking site, with an application and database. Later examples should visibly differ: email hosting, GPU inference, computational work, and a video-enabled application. Do not dress every workload as a website or show an endless marketplace at the beginning.

## Infrastructure presentation

Propose a left-to-right flow for an initial auto-layout: incoming demand, routing where installed, then application/worker and data dependencies. Server containers establish placement; arrows establish relationships. Freely moving a container changes presentation, not capacity or latency.

At normal zoom, show each software instance as a distinct labeled module. Supporting capabilities can use compact modules or indicators that reveal coverage on selection. At distant zoom, collapse details into server name, condition, and a compact utilization cue. Re-expand when selected or zoomed in. Selection highlights related links; do not draw every monitoring-coverage line permanently over every traffic connection.

Distinguish traffic, data dependencies, and monitoring coverage with labels and line treatment as well as color. Edge animation represents aggregate flow, not individually simulated requests. Only show diagnostic bottleneck information the player is entitled to observe. A physically running server can host a failed or unconfigured service; one green server lamp must not imply project health.

For shared hardware, show total use and an indication of other hosted projects. Rich project breakdowns follow monitoring availability. Power-off, sale, or lease release must expose affected projects before the action. Duplicate operations copy only the selected project's deployment, even when the server hosts other projects.

Component selection replaces the right panel with name, state, host, configuration, work progress, and contextual actions. Preserve an explicit return to project information. Use one clear primary action for the current state; group less frequent lifecycle actions separately. Explain unavailable actions inline rather than relying on hover.

Exact connection gestures remain deferred. Show compatible endpoints and connection outcomes in designs without committing the product to dragging or Connect-and-select. Provide a touch- and keyboard-accessible path in the eventual interaction design.

## Status, performance, and money

| Project view | Suggested hierarchy |
|---|---|
| Status | Current service state; demand and completed-work trend; relevant waiting/failure summaries; observed resource pressure and incidents |
| Performance | Selected billing period, contract target versus actual outcome, trend, and short factual explanations of losses or improvements |
| Finances | Cash received, earned amounts, receivables/payables, operating costs, compensation/refunds, then the transaction breakdown and trend |

Use sparklines in project rows and larger line charts in detail. Propose Current period / Previous period / Two periods ago as shared historical selectors. Label units by workload: requests, jobs, or the appropriate workload measure; do not sum incompatible units into one throughput line. Include chart legends, accessible textual summaries, and selected-point details on both touch and pointer devices.

Use gaps for missing monitoring samples, not zero values or invented interpolation. Distinguish unavailable monitoring data from an actual service outage. Monitoring-derived diagnostics and contractual/accounting records are different information sources. Do not lock financial facts behind a monitoring upgrade.

Clearly label actual transfers versus estimates and accrued obligations. Upfront cash is not proof that the whole contract has been earned. Show customer-attributed operational failures as failures even when exempt from player compensation.

## Visual system and mobile behavior

Preserve navy surfaces, restrained green accents, and familiar resource bars. Use readable sans-serif text for customers, explanations, and contracts; reserve monospaced typography for metrics, identifiers, and technical labels. Restrict glow to meaningful active/selected states. Use text and icons alongside red/amber/green status.

Propose generous touch targets around compact visual controls. Hover can enrich an interaction but cannot reveal its only explanation or action. Bottom sheets need a clear title, dismiss/return behavior, scrollable content, and accessible actions above safe areas. Charts should support tap-to-inspect without requiring a tiny hover target.

Use subtle server lamps, preparation progress, and restrained flow animation to make operation feel alive. Respect reduced motion. Do not animate the entire graph constantly, add cosmetic packet counts that contradict telemetry, or auto-fit the canvas on every incoming update.

## Figma Make handoff

Use the [Interaction specification](interaction-specification.md) for object/action ownership, state-dependent buttons, specialized capability sections, impact reviews, and required interaction frames. It supplies the delegated interaction hierarchy; do not invent controls from visual examples alone.

Read [Introduction](introduction.md), [Gameplay](gameplay.md), [Domain model](domain-model.md), and this brief first. Consult the [Technology catalog](technology-catalog.md) and [Balance baseline](balance/index.md) for dependency and example consistency. Current implementation and historical Cursor plans must not override intended behavior. Preserve the approved visual identity; preserve the agreed navigation and interaction structure; present visual refinements for review without adding game rules.

Produce linked desktop and mobile flows, reusable components and variants, and explicit empty, selected, unavailable, in-progress, failed, and recovered states. If the generated prototype uses a web stack, treat it as a design prototype; it does not settle production React Native graph/chart dependencies.

Design these connected scenarios:

1. First offer → contract review → accepted project → application/database preparation → explicit activation.
2. Healthy live project → rising demand → inspect observed pressure → add compatible capacity with visible cost and work progress.
3. Shared server failure affecting two projects → inspect affected deployments → recovery progress; automatic replacement follows researched/configured capabilities.
4. Monitoring unavailable → stale/missing detailed history, with ordinary server status and no dedicated monitoring-down alert.
5. Billing review → separate advance cash, earnings, usage receivable, costs, and any compensation.
6. Two learning slots occupied → inspect technology prerequisites or course benefits and see why another enrollment is unavailable.
7. Computational project → lost work → usable checkpoint recovery, or clear permanent failure when none exists. Do not offer retry.

Use one coherent fictional company and repeat the same project, server, and customer identities across screens. Include a shared server and a leased replacement so continuity is reviewable. Keep customer relationships distinguishable from overall business reputation. Do not invent new deadlines, negotiation controls, physical rack limits, or employee systems to fill a mockup.

Validate the linked flows against the interaction specification before judging visual polish. Product discussion is complete for this handoff; remaining questions should identify a concrete contradiction or implementation blocker, not reopen every button or service type.

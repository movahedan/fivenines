# Infrastructure interaction specification

Status: interaction hierarchy approved 2026-09-09; presentation and Park reconciled 2026-09-10. This specifies the agreed interaction hierarchy. Gameplay and balance documents remain authoritative for mechanics and costs. Catalog-only capabilities below are design coverage, not newly approved simulation mechanics.

The [interface brief](interface-design-brief.md) now follows the approved 2026-09-10 design: central offer/contract pages, embedded project sections, business side panels and shell task progress. Contextual action and recovery requirements below remain in scope even when their controls are absent from the preserved prototype. The inactive exported `InspectorPanel.tsx` does not define the final layout.

## Revised preparation and placement interaction

Use the [infrastructure editor contract](infrastructure-editor.md) for initial/incremental preparation. Requirements cards and both Add pickers prepare changes in one project-owned state. Configuration work is discovered automatically; the per-service Configure actions below describe contextual access to configuration and its scope, not a required series of manual dispatches before Setup. The project-level action commits preparation. Rows expose state/progress and power after readiness; body selection opens details. Visible host/entity anchors support drag connections alongside the existing Connect alternative. Placement targets are valid-only and empty results explain prerequisites inline.

## Selection, ownership, and presentation

Selecting an object highlights it and its relevant connections without moving or automatically fitting the canvas. Selection opens the object’s bottom drawer on both desktop and mobile without replacing business navigation. Checklist entries open the same drawer at the required action; recovery and destination selection continue within this contextual flow. Flows launched into a bottom drawer, including acquisition, target selection and impact reviews, retain that presentation on both devices. Offer browsing and Contract Review instead use the central content page. Returning preserves selection, canvas position, and list scroll.

Every inspector starts with object name, type, project where applicable, host, state, and scope. A server inspector lists all affected projects. A service inspector distinguishes shared project-service configuration from the selected instance's placement and runtime. Never let an instance's Configure button imply an instance-specific configuration override.

Use four levels of action presentation:

1. Canvas: selection, compact state, preparation progress, and contextual Add service. Do not place every lifecycle button on a rack.
2. Inspector primary action: at most one prominent action appropriate to the observed state. Healthy operation does not need an urgent action.
3. Visible groups: Configuration, Operations, and capability-specific sections such as Recovery or Targets. Use descriptive buttons, not an opaque overflow menu for essential operations.
4. Separated Removal section: uninstall, sell, or release with explicit impact review.

Configuration changes show their full service scope and become operational through the existing work policy. Opening a form has no simulation effect. Show current settings separately from pending changes; the project-level apply/setup action starts the required work rather than pretending the change is already active.

## Action states and feedback

| State | Presentation |
|---|---|
| Available | Action verb and applicable scope; show material cost and work before submission |
| Missing relevant technology | Locked action with named prerequisite and View technology link; show only relevant capabilities |
| Missing capacity or dependency | Disabled action with specific blocker and a route to the acquisition/configuration surface |
| Pending command | Pending feedback, no duplicate submission; do not show authoritative success before acceptance |
| Queued | Position/status in Operations and View task; no duplicate task button |
| Running | Progress and remaining work when known; no fabricated certainty for random recovery outcomes |
| Rejected or interrupted | Retain context, explain the actual reason, and offer only supported next actions |
| Completed | Refresh object state and record an appropriate Activity event; preserve navigation |

Do not silently drop commands when the authoritative state changes while a form is open. Revalidate target eligibility, cost, and affected objects before execution. Network pending/rejection states are interface requirements, not a specification of the deferred SSE protocol.

## Server actions

| Observed state/context | Primary action | Other actions | Scope and constraints |
|---|---|---|---|
| Healthy, powered on | Inspect hosted services | Add service, Power off; owned: Sell server; leased: Release server | Hardware actions affect all hosted projects; installation belongs to a selected project |
| Healthy, powered off | Power on | Inspect contents; ownership-appropriate removal | Power-on is immediate; software readiness is separate |
| Hardware failure | Repair server | Inspect impact; project-scoped recovery options; ownership-appropriate removal | Explicit repair cost and work; no repair starts merely because failover occurred |
| Repair queued/running | View task | Inspect affected projects | Prevent duplicate repairs; use existing task cancellation policy, not a special repair shortcut |
| Shared host viewed inside project | Inspect project services | View other hosted projects, Open in Inventory | Total hardware usage is shared; observed breakdown follows monitoring coverage |
| Owned asset removal | Review sale | Back | Show proceeds at 80% of purchase price when healthy, 60% for hardware damage; software/data/configuration faults do not discount hardware |
| Leased asset removal | Review release | Back | Show stopped deployments, data/work impact, and rental consequences; never label release as a sale |

Repair completion restarts formerly active installed services unless replaced elsewhere; formerly stopped services remain stopped. A replacement remains on its new host and an existing lease is not automatically released. Do not offer a whole-server duplication action in Inventory.

## Common service and instance actions

| Observed state/context | Primary action | Secondary actions | Scope and constraints |
|---|---|---|---|
| Required service absent | Add service | View requirements or technology | Select technology and compatible existing host, or acquire capacity |
| Installation/preparation pending | View task | Inspect requirements | Show queued/running status; do not expose a second Install command |
| Installed, configuration incomplete | Configure | View dependencies, Uninstall | Explain missing required inputs without requiring real credentials or networking expertise |
| Ready, stopped | Start | Configure, Move instance, Uninstall | Start is unavailable on failed/offline hardware or when required dependencies are absent |
| Running | Configure | Stop, Add instance, Move instance, capability actions, Uninstall | Configuration affects this logical service's instances; stop/move identifies the selected instance |
| Service failed, cause unknown | View status | View available observations and related host | No hidden-cause diagnosis or generic Fix everything button |
| Unknown cause with operating Monitoring coverage | View diagnosis | Inspect collected evidence and progress | Monitoring diagnosis consumes the authored work; it does not require a new manual Diagnose action; do not reveal attribution before completion |
| Diagnosed configuration incident | Repair configuration | View task and affected instances | Use the authored configuration-repair work and logical service scope; do not add a per-instance override |
| Diagnosed restartable software incident | Restart service | Prepare replacement where supported | Use the one-hour restart baseline and normal work policy; lost demand is not retried and lost job progress follows checkpoint rules |
| Recovery in progress | View task | Inspect source/destination and remaining blockers | Show recovery, not healthy service, until readiness is established |
| Instance replaced elsewhere | View replacement | Inspect old instance; supported cleanup | Do not auto-reactivate a duplicate or second primary |

Restart service is a response to supported restartable software incidents, not a universal repair for hardware or data loss. Automated Restart is the separate catalog capability that performs supported recovery automatically. Expose the relevant response without creating request retries.

Add instance chooses compatible capacity and prepares another runtime of the same service configuration. Move instance shows source, destination, preparation cost, and any data-transfer requirements; the source can continue serving during preparation. Duplicate deployment belongs to the current project and copies only its services/configuration on the selected source host. It uses accelerated preparation affected by skill, not instant hardware/data copying.

## Routing and load balancers

| Surface/state | Actions | Required explanation |
|---|---|---|
| Targets section | Select source → Connect → Select compatible destination; Remove destination, Open destination | Show target identity, host, compatibility, and observed eligibility; additions may target another balancer |
| Connection rejected | Choose another destination | Explain incompatible endpoint or routing loop; do not create the invalid link |
| No usable destination | Configure destinations or inspect blocking target | Balancer health alone is not end-to-end project health |
| Health Checks section | Configure checks, View checked targets | Unchecked is distinct from healthy; a powered-on host can contain failed software |
| Running balancer | Common service operations | No algorithm selector, priority slider, manual traffic weights, or Retry failed requests |
| Balancer recovery | Existing technology-supported recovery workflow | Reuse ordinary health, placement, preparation, and leasing policies; no separate service-specific economy |

Removing a destination previews affected paths, especially the last serving path. Display only detected health: without operating checks, do not expose hidden software failures through routing badges. Health Checks can continue while Monitoring is unavailable and does not establish customer fault attribution.

## Specialized capability sections

These extend the common service inspector rather than creating unrelated menus for every technology.

| Family / catalog coverage | Additional surface or action | Guardrails |
|---|---|---|
| Relational and Analytics Databases | Dependencies and data state; configure standby; Promote standby; Restore when supported | Promotion requires a ready standby on a different server; one primary; empty storage is not recovered data |
| Database Replication, Automatic Failover | Primary/standby roles, Ready/Not ready state, automatic-failover configuration | No transaction-level replication controls or invented precise lag; explain resource and readiness requirements |
| Backup and Restore | Available recovery records, recovery point, Select destination, Review restore | Only completed usable records; show overwritten data and interrupted service; exact advanced recovery controls follow implemented policy |
| Checkpointing | Latest completed usable checkpoint, recovery progress; Resume from checkpoint | Manual resume preserves the original deadline; no checkpoint means lost running work fails permanently; no restart from zero |
| Monitoring | Coverage selection, observed metrics/errors, alert configuration | Coverage is project-scoped across hosts; unavailable samples are gaps, not zero; no special Monitoring down alert |
| Quality Checks | Coverage/effect and operating state | Separate prevention from diagnosis; no immediate Repair or stacking protection button |
| Container Orchestration, Autoscaling | Managed instances, replacement enablement, pending replacement, leasing status | Show technology/runtime requirements, costs, and credit blockers; automatic leasing uses existing policy and needs no approval per lease |
| Automated Restart | Supported-service policy and observed recovery state | Does not fix hardware/data loss or retry failed customer work |
| Message Queue, Event Streaming | Backlog, capacity, durability, dependencies | No manual per-request browser, reorder, retry, purge, or replay action implied by the catalog description |
| Application Runtime, Background Workers, Container Runtime | Common configuration, instance and placement actions | Shared service configuration; no per-instance resource priority controls |
| Job Scheduler, Batch Computing, Model Training | Work progress, deadline, worker dependencies, supported checkpoint recovery | Customer owns computational outcome; no fabricated retry or deadline extension |
| GPU Computing, Model Serving, Distributed Computing, Distributed GPU Training | Compatible hardware, dataset/model dependency, participating capacity | GPU compatibility is real eligibility; research does not supply hardware; no model-quality editor |
| In-memory Cache, Object Storage, Search Engine, Vector Search | Sources/destinations, capacity, observed data-processing state | Do not invent data deletion, cache flushing, or manual reindex mechanics merely to fill a panel |
| Email Delivery, Mailbox Hosting, Real-time Messaging | Required dependencies and project service configuration | Use abstract game configuration, not real customer credentials or outbound messages |
| Payment Gateway Integration | Integration readiness and project dependencies | No real payment/account setup; no detailed provider migration workflow |
| Media Transcoding, Video on Demand, Live Streaming, Real-time Audio and Video, Multiplayer Game Server | Input/storage/delivery dependencies and relevant workload state | Common lifecycle; no new game/content production editor |
| Authoritative DNS, Reverse Proxy, CDN, Private Networking | Compatible endpoints and dependency configuration | Do not introduce realistic zone/credential/certificate administration as required gameplay |
| Rate Limiting | Policy configuration and effects supported by the engine | Legitimate rejected demand remains contractual demand; no free protection |

For catalog-only capabilities with unsettled configuration fields, Figma should use the common inspector and an explicitly labeled capability concept. Do not invent production-ready forms or mechanics. Unspecified controls remain outside the approved design.

## Project and operational work

| Context | Actions and behavior |
|---|---|
| Offer page and Contract Review | Browse available offers → full details → bold contract terms → Accept contract. Back preserves the selected offer and reading position. Close restores the prior workspace. No immediate acceptance from the global plus button |
| Accepted, preparing | Requirements checklist links to the exact missing service/configuration; Start service only when ready |
| Live project | Inspect Infrastructure and embedded Status / Performance / Finances, expand Contract, Park project, Notify customer of interruption |
| Parked project | Resume service when ready; inspect blockers and preserved contract timing. Park/Resume follows [Gameplay](gameplay.md#parking-and-resuming-a-project), with impact review before stopping work; no Park during initial setup |
| Planned or existing interruption | Preview project scope and send the game's customer notice; no estimated restoration-time field; notice does not waive compensation |
| Deployment duplication | Select source deployment for this project, destination capacity, review preparation/data work, confirm operation |
| Ended contract | View outcome and remaining resource costs; manage assets explicitly rather than assuming cancellation removes them |
| Operational queue | View task, source/target, project, progress and blockers; Cancel where supported by the work policy, preserving preparation progress |
| Learning slots | View technology/course, tuition and progress; cancellation/resumption follows paid coverage and preserved progress rules |

Do not add operational priority controls through a task list. Place distinct Operations and Learning indicators in the desktop top bar and the mobile strip above navigation; customer/financial events go to Activity. A click on an event opens the relevant object or retained record without changing simulation state.

## Impact reviews and removal

Use bottom-drawer reviews consistently on both devices. Include action verb, exact target, affected projects/services, immediate cost/proceeds, continuing costs, and applicable loss of volatile work or persistent data. Offer a neutral Back and a specifically named final action. Require review for Park project, power-off, destructive removal, destination removal that disrupts service, and restore/promotion with material impact. Ordinary selection and opening configuration do not require confirmation.

Never fabricate a precise financial penalty before its outcome is known. State that missed service remains subject to the contract and distinguish projected amounts from settled liability. Highlight known data/work loss; do not promise that uninstall, sale, or lease release retains data unless the data lifecycle actually guarantees it.

An unsupported or unsafe transition is blocked with a reason rather than implemented as a destructive shortcut. For example, moving a database needs a valid data path, and an unready standby cannot be promoted. Acquisition selection shows owned/leased status, compatible capacity and recurring cost; auto-leasing remains an already enabled automation action, reported through Activity.

## Figma deliverables and acceptance checks

Create reusable Server inspector, Service inspector, Target list, Recovery record selector, Acquisition drawer, Impact review, Task progress, and Action state components. Include desktop and mobile variants with the same semantics and explicit return behavior.

Required frames cover: healthy/shared/offline/failed/repairing server; incomplete/stopped/running/failed/preparing service; balancer with valid, unchecked, unhealthy and absent targets; ready/unready standby; usable/missing backup or checkpoint; unavailable monitoring history; blocked and successful automatic leasing; and removal affecting multiple projects. Show pending/rejected commands and disabled actions with reasons.

Verify these journeys across linked frames:

- Install and configure the first application's database, then activate the project.
- Power off a shared server with visible cross-project impact and continuing lease cost where applicable.
- Repair failed hardware while replacements remain elsewhere, without accidental duplicate activation.
- Add an instance and connect it to a balancer only when eligible; reject a routing loop.
- Promote a ready standby or select a usable restore point; block invalid recovery.
- Resume lost computation from a checkpoint with its original deadline; show permanent failure otherwise.
- Inspect monitoring gaps without revealing hidden causes or sending a monitoring-outage warning.
- Duplicate only the selected project's deployment and retain source service during migration preparation.

These checks validate interaction coverage, not engine correctness. No runtime implementation or production graph/chart library selection is authorized by mockup completion.

Release filtering applies to all capability inspectors: expansion technologies in the [catalog scope](technology-catalog.md#version-one-scope) do not require version-one controls or Figma delivery frames. Removed technologies have no separate action panels.

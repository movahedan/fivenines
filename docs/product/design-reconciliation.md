# Design reconciliation

Reviewed 2026-09-10 against the supplied `Design product based on docs` export and the product/milestone reference merged in [PR #59](https://github.com/movahedan/fivenines/pull/59), commit `86b08175183fce67bda05f66fe670a6c9a7abaaf`. The user approved the exported shell/workspace layout while retaining product capabilities missing from the prototype, and clarified that Park maps to the existing project offline behavior. The user also specified that the server design on the main project page is the shared visual reference for all other server surfaces.

## Decision and source boundary

The [preserved application](../../apps/figma-design/README.md) is the visual reference. The [interface brief](interface-design-brief.md) and [interaction specification](interaction-specification.md) record its accepted presentation and the complete intended interactions. Gameplay, domain relationships and authored balance remain authoritative for behavior and numbers. Imported prompts and unused source are historical evidence, not additional instructions or product requirements.

The Park accounting decision was explicitly confirmed during review: preserve the old offline action but use the new signed-contract settlement, without a separate financial exemption. The historical hosting design (`d103ba7`, `.cursor/plans/fivenines-hosting-platform.design.md`, lines 75–86) recorded Park and recurring pause; only its offline intent is retained, not that superseded billing calculation.

Keep the export unchanged as reference material. Correct fixture data, missing handlers, responsiveness and accessibility when implementing the corresponding capability in the production application. No new Figma generation, production engine work, catalog reduction, or GitHub milestone edit is required by this reconciliation.

## Accepted presentation changes

| Surface | Export evidence | Decision recorded in interface documents |
|---|---|---|
| Desktop shell | [App.tsx](../../apps/figma-design/src/App.tsx), `RightTabStrip`, `RightPanel`, `PanelSection` | Resizable/collapsible Projects on the left; Inventory, Learning and business Finances share the right panel; project workspace stays central. |
| Offers and contracts | [NewProjectPage.tsx](../../apps/figma-design/src/NewProjectPage.tsx), `OfferPage`, `ContractPage` | Central offer browsing and separate Contract Review; two desktop columns, stacked mobile content; previous/next and count browse existing offers. Replace the old mandatory offer bottom drawer. |
| Project information | [InfraCanvas.tsx](../../apps/figma-design/src/InfraCanvas.tsx), `Section`, `LiveTabs` | Collapsible Contract, Infrastructure, and Setup checklist or Project status sections. Status/Performance/Finances live below infrastructure on both devices. |
| Task progress | [TopBar.tsx](../../apps/figma-design/src/TopBar.tsx), [App.tsx](../../apps/figma-design/src/App.tsx), `OpsStrip` | Desktop top-bar indicators and mobile strip above navigation replace left/right floating progress. Retain one operational queue and two distinct shared learning slots. |
| Shell overlays and details | `ActivityDrawer`, `ProfileDrawer`, [InventoryView.tsx](../../apps/figma-design/src/InventoryView.tsx), [LearningView.tsx](../../apps/figma-design/src/LearningView.tsx) | Activity opens from the right; account from the left. Inventory/Learning details replace their list in place. These are not forced into the action-drawer rule. |
| Charts and clock | `LiveStatusTab`, `LivePerformanceTab`, `LiveFinancesTab`, `CalendarClock` | Compact availability bars, demand/resource trends and multi-series financial charts; calendar/day-progress treatment. Units, time boundaries and information entitlement retain their product meaning. |
| Server appearance | `InfraCanvas.tsx`, `ServerRack`; incomplete secondary server views | Reuse the main project rack design across Inventory, acquisition and details, adapting density and relevant content rather than treating incomplete pages as separate designs. |
| Park | [ProjectWorkspace.tsx](../../apps/figma-design/src/ProjectWorkspace.tsx); historical hosting design at commit `d103ba7`, lines 56, 75–86, and existing [Project.asOffline](../../packages/fivenines-engine/src/project.ts) | Preserve project offline intent in [Gameplay](gameplay.md#parking-and-resuming-a-project). Add impact review, resumed/blocked states and project scope; do not inherit obsolete single-route or recurring-fee logic. |

The prototype's `InspectorPanel.tsx`, `Navigation.tsx` and `OfferDrawer.tsx` are not imported by its reachable entry tree. Their existence is not proof of final inspector, navigation or offer behavior. Acquisition remains imported, but its old drawer classes and color variables are absent from the exported stylesheet; its broken rendering does not replace the intended contextual bottom drawer.

## Final decision register

The user explicitly approved all eight proposed resolution groups after reviewing the discrepancy list. These are accepted decisions, not recommendations awaiting a later implementation discussion. Together with the earlier server-visual and Park decisions, they close every identified design/product conflict. Development can proceed against these documents; implementation and verification remain pending in their assigned milestones.

| Group | Covered items | Approved resolution |
|---|---|---|
| Acceptance and preparation | C1, C2, C7 | Acceptance opens empty setup immediately; contract/checklist remain accessible; Back preserves the offer; actual acquisition occurs only on final confirmation. |
| Contract and learning policy | C3, C4, C5 | Keep current setup patience and catalog research prices/durations/prerequisites. Distinguish completed course levels from active study and preserve two-slot enrollment rules. |
| Money and costs | C6, C8, C9 | No double-counted advance. Rent accrues hourly; daily quotes and `OPEX/day` show estimated daily cost at the current state/rate. Separate actual financial postings from estimates. |
| Monitoring and SLA | C10, C11, C12 | Basic state and contract/financial facts remain visible without Monitoring; detailed resource history and diagnosis require coverage. Use demand Availability, not time Uptime; distinguish current failure from period breach. |
| Object details | C13 | Server/service selection opens a bottom drawer on both devices, independent of business panels. Checklist items open the required action directly in that drawer. |
| Growth and recovery | C15, C16 | Retain full capability scope and persistent Add server access. Connections use Select source → Connect → Select compatible destination without required drag. Recovery/destination selection uses contextual drawers. |
| Activity and account | C17 | Events open their related object/record. Show functional account actions such as Settings and Sign out; omit Profile and What’s new until separately defined. |
| Mobile and charts | C18 | Retain the main rack design with canvas-contained pan/zoom and viewport-fitting page/header layouts. Charts have period selection and touch point inspection. Scenario navigation is prototype-only. |

C14 follows the separately approved Park decision: stop only the selected project’s service, preserving contract timing and modern settlement without affecting co-hosted projects.

## Corrections during implementation

These are dispositions against existing rules, not changes to the balance baseline. The named milestone owns implementation; the archive intentionally retains the original evidence.

| ID | Evidence in the export | Required correction and owner |
|---|---|---|
| C1 | `App.tsx`: acceptance creates `accepted-no-server`, excluded from `inWorkspace`; project row callback is empty. Browser acceptance leaves “No active project.” | Open the accepted setup workspace immediately and make selection functional before acquisition. Contract and missing requirements must be reachable without hardware. M4. |
| C2 | `NewProjectPage.tsx`: Contract Review Back calls `onSelectOffer`, which sets the contract phase again; offer count is always 1. | Back restores the same offer; browse real eligible offers without rerolling. Handle empty, expired, accepted and credit-blocked states. M4/M6. |
| C3 | `scenario.ts`, `OFFER.cancellationTerms`: full refund as soon as the setup allowance is missed. | Explain allowance followed by customer patience. The canonical opening example withdraws at hour 39 if still unprepared, not hour 24. [Customer policy](balance/customers-and-offers.md#setup-tolerance). M4/M6. |
| C4 | `scenario.ts`, `TECHNOLOGIES`: Monitoring is 4h/8 monthly; cache and Load Balancer prerequisites differ from the authored catalog. | Use current research duration/tuition/prerequisite data; Monitoring is 168h and 40 monthly. Learning tuition ends at completion and is not a software license charge. [Research baseline](balance/technology-and-research.md). M3/M9. |
| C5 | `LearningView.tsx`: `currentLevel > 0` creates “ongoing” study; Start research/enrollment controls have no active lifecycle. | Separate completed skills from enrollments, show both slots, payment coverage, insufficient-funds pause, cancellation and resume. Correct Data Recovery effect copy to include supported processing work, not only preparation. M3/M7/M9. |
| C6 | `AcquisitionDrawer.tsx`: rental accrues every 24h; lease eligibility always true. `InventoryView.tsx` shows 1.27/day owned opex. | Keep a daily quote if useful, but accrue rent/24 hourly plus applicable operating cost; enforce the credit rule and actual purchase affordability. Derive shared costs from one state. [Hardware/economy](balance/hardware-and-economy.md). M4–M6. |
| C7 | `ProjectWorkspace.handleAcquire` ignores tenure; `cashForStep` deducts purchase before acquisition; no hardware selection reaches state. | Selected asset/tenure must determine costs, capacity and identity; acquisitions cannot be represented by advancing a scenario index. Preserve the same asset across Inventory and project views. M2/M4. |
| C8 | `InfraCanvas.LiveFinancesTab`: advance 80 + earned 80 + earned 40 − costs 17.77 − costs 8.90 = displayed 173.33 net. | The advance is payment of the fixed fee, not extra earned revenue. On those illustrative earned/cost entries, earned contribution is 93.33; cash movement and unearned amounts are separate. Business Finances also mixes static cash, receivables and estimates. M5/M6. |
| C9 | `TopBar` always displays 8.90 OPEX, even with no assets, without an interval; business Finances always uses 340 cash. | Reconcile shell, inventory, project and business financial facts; label observed/current-rate/estimated/settled amounts and their interval. Do not display another wallet. M5/M6. |
| C10 | `LivePerformanceTab` shows CPU/RAM history with no Monitoring installation; no historical coverage selection. | Basic current summaries and contractual/financial facts remain available. Detailed telemetry, history and diagnosis require operating coverage; gaps remain missing. Keep current plus two completed periods and accessible point details. [Observation](balance/observation.md). M5/M7. |
| C11 | `LiveStatusTab`: “Uptime this period” duplicates demand SLA; incident header says “SLA breached” while its data remains 95.2% and “Services healthy 2/2.” | Separate demand availability, instantaneous state, period compliance and responsibility. A current outage alone does not prove a period breach. All widgets must describe the same state. M5–M7. |
| C12 | `LiveStatusTab` calls CPU 82% “approaching warning threshold”; rack and chart still show 7%. | Use actual observed state and the configured threshold plus persistence; value alone does not establish an alert. Do not reveal hidden causes or add a Monitoring-down warning. M7. |
| C13 | `ProjectWorkspace` tracks selection but renders no inspector; `InfraCanvas` checklist is passive; Add server disappears after the first server. | Add state-dependent install/configure/start/stop, capacity addition, shared impact and task flows in the accepted visual language. Preserve project-specific duplication and migration. M4/M5/M8. |
| C14 | `ProjectWorkspace` exposes Park during setup with no callback and no Resume state. | Apply documented activated-project Park/Resume semantics; show impacts, blockers and original timing. Do not park co-hosted projects or freeze contract obligations. M4–M6; checkpoint interactions M7. |
| C15 | No reachable routing graph editing, standby promotion, backup selection, checkpoint recovery, automatic leasing or multi-project failure journey. | Complete these already planned capabilities as their engine prerequisites arrive. Their absence is not a deferral or a reason to move every UI change to M10. M4–M9. |
| C16 | Eight technology fixtures, two acquisition choices, one appointment project; no finite-job flow. | Keep full V1 catalog and hardware/workload semantics. Add workload-relevant disk throughput/IOPS, GPU and compatibility details without crowding the compact rack. Finite jobs use deadlines, not website SLA/weekly fields. M2–M9. |
| C17 | Activity rows carry links but are not actionable; static events are visible in the empty scenario; account menu only closes. | Connect events to objects/retained records and correct actual account actions. Do not add a new profile/What's new feature merely because an illustrative menu names it. Login stays required for production gameplay. M4/M6/M7/M10. |
| C18 | At 390px, the rack extends beyond the visible width; the journey controller overlays navigation. `index.css` lacks reduced-motion handling; many targets/text are very small. | Production needs intentional graph scrolling/zoom, responsive headers, safe areas, keyboard focus/return, readable contrast, chart summaries and touch targets. Journey controls remain prototype-only. Address as each flow ships; M10 verifies completeness. |

## Milestone impact

No milestone is added, reordered, marked delivered or reduced in scope. GitHub milestones remain links to these local documents.

| Milestone | Disposition |
|---|---|
| [1 — Architecture and mathematics](../milestones/engine-architecture-and-mathematics.md) | No design-driven equation or outcome change. Retain independent numerical verification and full resource model. |
| [2 — Entities and catalogs](../milestones/entities-and-catalogs.md) | Existing identity/catalog requirements remain correct. The new reference must not narrow ownership, hardware or V1 coverage; clarify use of the main workspace rack as the shared server visual. |
| [3 — Demand and learning](../milestones/demand-and-learning-foundations.md) | Clarify new progress/detail placement, completed levels versus active enrollment, and current tuition/duration fixtures. |
| [4 — Preparation and operations](../milestones/infrastructure-preparation-and-operations.md) | Replace contract drawer with central pages; specify reachable empty setup, contextual actions, acquisition, task indicators, patience, Park/Resume scope and blockers. |
| [5 — Allocation and execution](../milestones/resource-allocation-and-execution.md) | Connect embedded summaries to real outcomes, truthful availability/costs, Park effects and workload-relevant resource details. Retain first commercial playtest. |
| [6 — Contracts and growth](../milestones/contracts-economy-and-growth.md) | New offer/review layout; preserve patience, Park timing and exact separation of cash, prepaid fees, earnings and liabilities. |
| [7 — Observation and recovery](../milestones/observation-incidents-and-recovery.md) | Permit compact Status bars with detailed observed history; preserve coverage, period selection, thresholds, diagnosis, recovery and checkpoint flows. |
| [8 — Routing and automation](../milestones/routing-and-automation.md) | Extend the approved infrastructure surface for targets/automation; drawer rules apply to contextual actions, not all navigation. |
| [9 — Learning and catalog coverage](../milestones/learning-and-technology-coverage.md) | Complete all V1 subjects in the accepted layout; fixture subset does not change scope or authoritative course effects. |
| [10 — Interface and validation](../milestones/interface-and-game-validation.md) | Update layout acceptance and preserve the archive; verify responsive/accessible production flows rather than treating prototype completion as gameplay delivery. |

## Verification evidence and limits

The review followed `main.tsx` → `App.tsx` imports and compared the reachable components and fixtures with product documents and all ten milestones. Local HEAD contains the merged PR #59 commit. GitHub CLI metadata retrieval was unavailable during initial review; the merged commit and local files supplied the baseline.

A temporary local preview used the unchanged exported `src` with a minimal Vite wrapper and existing repository dependencies, omitting Figma editor-specific plugins. Browser checks covered desktop entry, offer details, full contract, acceptance, project-row selection, acquisition rendering, setup frames, and the live frame at desktop and 390×844 mobile size. Scenario arrows were used to inspect frames unreachable through ordinary actions. The empty post-acceptance workspace and mobile rack clipping were observed directly.

These are reference inspection results, not a successful end-to-end game test or a complete accessibility audit. The source has no production engine integration. Build and repository verification for the archive belong in the PR evidence; no milestone implementation is claimed completed by this document.

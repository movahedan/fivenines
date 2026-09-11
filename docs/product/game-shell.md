# Game shell and section map

Status: production placement map for milestone 5.1. This is the durable screen/state owner map that `game-template` and later editor work follow. Visual appearance stays with the preserved [Figma reference](../../apps/figma-design/README.md) except the [editor amendments](infrastructure-editor.md). Runtime wiring uses only unchanged supported engine APIs or honest empty states.

Read with the [interface brief](interface-design-brief.md), [interaction specification](interaction-specification.md), and [repository boundaries](repository-boundaries.md). Proposed TypeScript slot names and file paths for the first template PR live in the current-code plan, not here.

## Authority versus the Figma export

`apps/figma-design/src/App.tsx` is the live desktop/mobile shell. `Navigation.tsx` and `InspectorPanel.tsx` are unused or inactive export leftovers; they do not define production layout.

These approved product amendments override the export where they conflict:

| Topic | Figma export | Production |
|---|---|---|
| Project column order | Contract → Infrastructure → checklist or live tabs | Contract → Requirements → Infrastructure → persistent checklist → Status / Performance / Finances tabs |
| Checklist after go-live | Hidden once live | Remains available |
| Requirements strip | Absent | Horizontal helper after Contract |
| Account menu | Includes View profile and What's new | Settings and Sign out only |
| Shell cost label | `OPEX` without period | `OPEX/day` (estimate; rent still accrues hourly) |
| Inventory / acquisition racks | Full editor rack in places | Compact representations; editor rack stays in the web server node |

Do not restore superseded rules: universal rack reuse, manual rack dragging, or a required series of manual Config clicks.

## Desktop and mobile destinations

Breakpoint follows the reference: mobile below 768px, desktop at 768px and above. Intermediate widths keep the desktop panel chrome and may collapse panel width.

| Destination | Desktop | Mobile |
|---|---|---|
| Projects | Collapsible, resizable left panel | Bottom-nav tab; selected project fills the content column |
| Inventory | One of three right-panel destinations | Bottom-nav tab |
| Learning | Same right panel, exclusive with Inventory and Finances | Bottom-nav tab |
| Finances (business) | Same right panel | Bottom-nav tab |
| New project | Replaces the center column (offer, then Contract Review) | Replaces the content column; not a tab |
| Activity | Right-edge overlay from the shell | Same overlay |
| Account | Left-edge overlay from the top bar | Same overlay |
| Object / acquisition / impact | Bottom drawer over the workspace | Same drawer; does not replace business tabs |
| Operations / Learning progress | Top bar chips | Compact strip above bottom navigation |

Default landing destination is Projects. Desktop may show a selected project's workspace in the center while Projects stays open on the left. Mobile Projects shows either the list or the opened workspace, not both.

## Section map

`Build in 5.1` means the shell or component layout ships. `5.1 data` means production may bind current public Game fields without changing the engine. `Visual only` means Storybook/fixture or an honest empty/unavailable production state. Later milestones own real behavior, not a second layout.

| Section | Desktop slot | Mobile slot | 5.1 production data | Visual-only / later owner |
|---|---|---|---|---|
| Account control | Top-bar leading control | Top-bar leading control | Session identity via web auth adapter; Sign out | Profile / What's new stay omitted |
| Cash, reputation, OPEX/day | Top-bar metrics | Same, compact | Cash, reputation if already projected; OPEX mapped from current finance without new formulas | Daily label is presentational; hourly accrual stays engine truth |
| Pause / speed / calendar | Top-bar trailing cluster | Same, stacked | Existing pause and 1/2/4 speed; clock from `hourIndex` | Calendar chrome is presentational |
| Operations progress | Top-bar chips | Progress strip | Current operational queue occupancy and task labels | Repair/migration/replacement kinds wait for M7–M8 |
| Learning progress | Top-bar chips, distinct from Operations | Same strip, distinct rows | Two-slot enrollment list already in Hub | M9 coverage closure |
| Activity trigger | Top-bar control | Top-bar control | Opens overlay | — |
| Activity feed | Right overlay | Right overlay | Existing Hub command/event log mapping | M6–M8 enrich event kinds |
| Projects list | Left panel | Projects destination | Offered / accepted / served / parked lists and selection | M6 offer/relationship expansion |
| Empty center | Center column | Projects content | Copy + New project action | — |
| Offer browse | Center column | Content column | Current offered projects; previous/next among existing offers | No generated/refreshed marketplace |
| Contract Review | Center column | Content column | Existing accept/decline; advance on Accept only | M6 expanded terms |
| Project header | Center, above sections | Same | Name, customer, service state, Start/Park where current commands exist | Park hidden during setup (already engine rule) |
| Contract (in project) | Collapsed section, first | Same order | Available accepted terms | Remaining obligations M6 |
| Requirements | Horizontal row after Contract | Same | Visual component and isolated stories | Eligibility/placement queries M5.2 |
| Infrastructure canvas | Center project section | Contained pan/zoom section | Placeholder in the shell; editor in #128 | Live graph/placement M5.2; balancer M8 |
| Setup checklist | Below Infrastructure, always reachable | Same | Current first-project queue/tasks where exact | Automatic discovery / Apply path M5.2; generalized setup M6 |
| Status / Performance / Finances tabs | Below checklist | Same | Status may use current SLA/service strings; Performance/project finances empty or factual current fragments only | Monitoring history M7; commercial detail M6 |
| Inventory | Right panel | Inventory destination | Fleet cards, buy/lease/sell/release already in Hub | Recovery actions M7 |
| Learning | Right panel | Learning destination | Catalog rows and enroll/pause/resume already in Hub | M9 remaining capabilities |
| Business finances | Right panel | Finances destination | Cash, receivable, opex already shown; full ledger empty layout | M6 ledger/relationships |
| Object details | Bottom drawer | Bottom drawer | Existing inspect/acquisition where Hub already opens a drawer | Capability inspectors with their milestones |
| Target overlay | Temporary canvas overlay | Large touch targets | Fixture stories only | Engine eligibility M5.2 |
| Load balancer node | Independent round node in editor | Same | Fixture visual; unsupported in production | M8 |

## State ownership

Business and game state stay in `@apps/web`. Shared UI receives display data and callbacks. The template owns responsive placement, scroll/safe-area shells, and how the same slot nodes appear as desktop panels versus mobile destinations.

| Concern | Owner |
|---|---|
| Selected project, offer phase, destination, overlay and drawer identity | Web |
| Apply/discard/unapplied editor proposal | Web project workspace, only once M5.2 exists; 5.1 has no production proposal state |
| Panel open/closed, exclusive right destination, widths | Controlled inputs into the template; web stores them |
| Status bar placement | `GameStatusBar` `static` (in flow) or `absolute` (stuck to the bottom of a relative parent) |
| Overlay chrome versus body | Template owns backdrop, frame, title, and close; web supplies the body node |
| Desktop versus mobile geometry, collapse chrome, rail tabs, resize handles | Template (`react-resizable-panels` on web) |
| Graph camera, selection, layout | Web `infrastructure-editor` (#128), not the template |
| Auth session | `@apps/web` + `@packages/auth`; template gets an account slot node |

## Current Hub versus this shell

Today `/hub` composes `GameTemplate` around the existing Opening Shift commands. Event log lives in the Activity overlay. The infrastructure canvas, Requirements, and live eligibility stay empty or later-slice. Do not fake unsupported setup, eligibility, or balancing.

## Out of scope for this map

Engine source, tests, catalogs, public APIs, and balance numbers. Marketing and auth pages. Lab redesign. Native application. Employees. Faking unsupported setup, eligibility, or balancing in production.

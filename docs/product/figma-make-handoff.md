# Figma Make handoff

Status: ready for design generation and review. Product direction is settled for this handoff; runtime implementation and visual usability validation remain separate work.

## Prompt to use with the attached product documents

Design Five Nines, a game about running an infrastructure operations business for customers. Create a coherent, interactive desktop and mobile prototype using the attached product reference. Preserve its existing dark navy and restrained green console identity, with readable human-facing text and monospaced metrics. Use English throughout. The infrastructure system is the main play surface, with rack-shaped server containers and the current project's installed software inside them. These shapes do not introduce physical rack-space mechanics.

Read `index.md`, `introduction.md`, `interface-design-brief.md`, and `interaction-specification.md` first. Read `gameplay.md` and `domain-model.md` to resolve behavior and ownership. Use the technology and balance documents for consistent requirements, costs and progression. `baseline.json` owns numeric defaults; do not invent a competing catalog. `open-questions.md` identifies engineering/deferred work, not missing permission to design approved screens. Historical Cursor plans and current prototype mechanics are not product authority.

Use mobile bottom navigation ordered Projects, Inventory, a prominent central New project action, Learning, Finances. On desktop, use expandable/collapsible folder-like rail panels with vertically labeled tabs. Keep an important-status top bar on both. Operations progress floats compactly on the left of active content; the two shared Learning slots float on the right. Keep Activity reachable without covering the canvas in permanent alert cards.

New project opens a bottom drawer containing available offers on both devices. Select an offer to see complete details and bold contractual terms in the same drawer; return to the list without losing position. Only explicit acceptance collects the advance and creates setup work. Bottom-drawer flows keep matching directional and scrolling semantics on desktop and mobile, with visible back/close controls. They are not centered desktop modals.

Inside a project, desktop keeps Status, Performance and Finances in the right panel beside infrastructure. Selecting an object opens its inspector there; mobile uses a bottom sheet. Use the interaction specification's object ownership, state-dependent primary actions, configuration/operations/removal groups, blocked-action reasons and impact reviews. Server actions can affect several projects. Service configuration is shared across that service's instances; health and placement are instance-specific. Never duplicate unrelated projects sharing a server.

Produce a linked prototype with reusable components, meaningful example data, and explicit empty, healthy, preparing, failed, recovering, unavailable, pending and rejected states. Pair desktop and mobile frames for the same situation. Do not spend the entire output on one healthy dashboard. Include a component/state overview so implementation can follow the hierarchy.

The game requires login. An illustrative login screen may connect to the mock scenario, without implementing real credentials, billing, servers or external services. Generated web code is a design prototype; production components must preserve the React Native path. Do not choose a DOM-only graph/chart dependency as an architectural requirement.

## Deliverable map

| Deliverable | Required contents |
|---|---|
| Shell | Mobile tabs/action button, desktop rail folders, top bar, Operations and Learning groups, Activity access |
| Acquisition flow | Offer list, full details, contract review, acceptance, empty/expired/unaffordable states |
| Project workspace | Setup requirements, ready activation, healthy system, degraded system, recovery, ended contract |
| Object inspectors | Server, logical service/instance distinction, routing targets, data recovery, monitoring coverage, task progress |
| Inventory | Owned and leased hardware, shared occupancy, power, repair, sale/release impact |
| Learning | Technologies and Courses, prerequisite inspection, two occupied slots, paused/resumable study and tuition explanation |
| Reports | Status, performance and project finances; separate business finances; sparklines and detailed historical views |
| Feedback | Activity groups, detected versus unknown cause, missing observations, pending/rejected actions and accessible explanations |

## Coherent scenario data

Use the same fictional identities across all screens. Names here are presentation fixtures, not new catalog entries or mechanics.

| Identity | Role |
|---|---|
| Northstar Operations | Player business |
| Maya / Maya's Appointments | First acquaintance customer / appointment-site project |
| Harbor Mail / Team Mailboxes | Later customer / mailbox-hosting project |
| Atlas Research / Training Run | Computational customer / finite training project |
| Server A | Shared hardware hosting components for two projects in the later-state scenario |
| Server B | Separate compatible recovery capacity |
| Server C | Automatically leased replacement in the later-state scenario |

Show first-project and later-business scenarios as separate moments, not simultaneous starting assets. Hardware specifications and project prices must come from compatible baseline entries. The appointment project starts with Application Runtime and Relational Database, no extra research or payment/email feature requirement. Do not label it PostgreSQL unless a concrete software brand is deliberately introduced; the authored catalog uses Relational Database.

For finance illustrations, keep cash, receivables, earnings and projections separately labeled and arithmetically consistent. Example: an 80-unit weekly advance creates 80 units of cash received; halfway through the service period, 40 units of fixed fee are earned and 40 remain unearned, before any separate costs or compensation. Do not treat the whole advance as profit. Use fictional game currency rather than real transaction forms.

## Required connected flows

1. Offer → full contract → accept → prepare application and database → Start service.
2. Healthy project → observed capacity pressure → acquire/select compatible hardware → Add instance → preparation → eligible routing destination.
3. Shared-server hardware failure → impact across projects → repair work → repaired original, with replaced instances remaining elsewhere.
4. Database failure → ready standby promotion, or usable backup restore; show why an unready standby cannot be promoted.
5. Lost computation → Resume from checkpoint with the original deadline; no usable checkpoint → permanent failure.
6. Monitoring unavailable → old data and gaps, ordinary server state, no dedicated monitoring-outage notification.
7. Review performance → explain compensation → reconcile actual cash and receivables with project finances.
8. Learn technology/course → two slots occupied → paused/resumed learning with explicit monthly tuition status.
9. Review server sale/release → named affected projects and data/work loss → specific final action.

## Review checklist

- Can the player identify the selected object and scope before pressing a button?
- Does each destructive action explain affected projects and ongoing costs?
- Are full offer details accessible before acceptance, on both device layouts?
- Do drawers scroll without accidental dismissal and provide non-gesture controls?
- Do unavailable actions explain a real blocker instead of silently failing?
- Is server health distinct from service readiness and project performance?
- Are charts truthful about missing monitoring, estimated latency and zero demand?
- Are learning progress and operational work separate from demand queues?
- Do shared servers retain identity, capacity and cost across screens?
- Does keyboard/touch access work without hover-only actions or color-only status?
- Are mobile text, targets and sheets usable without overlapping navigation and floating cards?

No guest gameplay, permanent jail, Opening Shift ending, manual routing weights, per-request retry, internal subticks, physical facility construction, or new employee/away-time features. Do not display omniscient incident causes or promise recovery of data never backed up. Fine geometry, spacing and artwork are design choices; approved rules and ownership are not.

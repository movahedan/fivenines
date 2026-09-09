# Product direction

## Agreed transition

The existing hosting initiative remains useful through Phase 2: explicit placement and owned versus leased servers. Phase 3 onward must be redesigned around project systems, preparation work, and gradual business growth. Phase numbers in unrelated website plans are unaffected.

This document defines product direction. The [milestone sequence](../milestones/README.md) defines dependency-ordered implementation and verification; it does not set delivery deadlines.

## What to retain

The simulation engine already provides demand patterns, resource constraints, regional placement effects, operating costs, cash and receivables, billing, and request-based SLA accounting. Its separation between commands and simulated time is useful for future operational work.

Keep owned/leased economics and the principle that spare capacity elsewhere is not automatically available to a project. The placement relationship will need to describe software deployments rather than assume one whole project always fits on one server.

Retain useful outage capacity effects and tests from work already performed. Adapt monitoring ownership and repair behavior instead of discarding all incident work or finishing the old design unchanged.

## What changes

| Current foundation | Intended evolution |
|---|---|
| Accepting routes a project directly into service | Acceptance creates work; readiness and activation become explicit concepts |
| One project is one traffic source on one server | A project can require several software components and hosts |
| Project success is derived from server request handling | Success must account for required components and the contracted workload |
| Initial offers are a populated board | A small personal network provides early work; reputation expands opportunities |
| Hardware mainly scales generic resource capacity | Workload needs make hardware specialization valuable |
| Last-hour metrics and an SLA ring | Historical project/infrastructure feedback with explicit monitoring coverage |
| Repair and installation are immediate actions in the outage proposal | Operational work creates space for preparation and future staff |

## Agreed design coverage and next execution work

The design covers acceptance, configuration, activation, revenue, and recovery across continuous services and finite jobs. Use the agreed first project: an acquaintance's low-demand appointment-booking site with an application and database on one server and an 80% SLA target. Then compare a finite computational job to ensure the concepts do not assume every project is a website.

Gameplay, the balance baseline, and the interface/interaction specifications now define player choices, timed work, failure responsibilities, and visibility. Technical execution plans in `.cursor/plans` must implement these rules without reopening settled product decisions.

Implementation must preserve shared infrastructure, distinct components, preparation, and end-to-end outcomes across the designed workload model. Split delivery by technical dependency and verification needs; do not narrow the domain architecture back to a website-only prototype.

## Core-loop validation checkpoints

Opening Shift is not an intended product mode. The user described a flow for validating the game, not a timed campaign, tutorial mode, or player-facing checklist. Do not carry the prototype's 14-day ending or win conditions into the product.

Use the following working sequence to evaluate the first playable product:

1. Accept and prepare the first customer project, then bring it into service.
2. Sustain that project for roughly three billing cycles with no major problems, allowing minor recoverable incidents.
3. Accept and prepare a second project, then bring it into service.
4. Sustain both projects together for roughly three further billing cycles with no major problems.

Three cycles is a working validation duration, not a locked balance value or a mandatory waiting gate before accepting another project. Successful operation retains the contracts, meets commitments at an acceptable level, and covers ongoing operating costs. A minor incident is recoverable without customer departure or heavy compensation; exact balance thresholds remain open. These checkpoints should test preparation, service delivery, cash flow, and managing shared resources.

A later checkpoint, after the initial playable product, is hiring and training an employee who can manage an assigned project. The intended benefit is better service, improved earnings from managed projects, and greater resilience to demand spikes. The task model, training, supervision, costs, and limits require later design. This direction does not specify a flat income multiplier or guarantee immunity from overload.

## Deferred or unresolved

- Away-time progression and its return report are deferred. Their agreed behavior is recorded in [Gameplay](gameplay.md#progress-while-away), but they must not block the first playable implementation of the redesigned core loop.
- The target is authoritative server game state with SSE updates; device-side game storage holds only a snapshot and unsent player commands. Login is required before play. The engine remains in the frontend for development, and migration to authoritative Nest game sessions is deferred. See [Gameplay — account access and game state](gameplay.md#account-access-and-game-state).
- Spline is set aside. Graph/chart libraries remain undecided and must account for native mobile support.
- Reputation, relationships, courses, and technology progression have delegated numeric defaults. Staffing remains deferred; runtime balance validation remains required.
- Opening Shift is excluded from product direction; its existing implementation is prototype behavior to address in a later technical plan.
- One outer tick with no subticks is settled; aggregate latency and work allocation still require technical verification.

## Independent platform delivery

Website delivery, legal pages, cookies and consent, SEO and PWA work have merged into main; authentication and service health are also complete per the user. These platform capabilities remain independent of the game redesign. Their completed plans have been removed; current code and workspace guidance describe implementation.

Coordinate when work crosses the boundary: public product copy must describe actual availability, shared UI must preserve the mobile path, and transport work must not create a second simulation authority. These documents introduce no legal policy or change to consent behavior.

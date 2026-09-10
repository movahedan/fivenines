# Milestones and delivery workflow

This is the standing working agreement for agents planning and delivering Five Nines. Read it with the assigned milestone, current code, and the relevant product documents. The user should not need to repeat this workflow for each task.

## Document responsibilities

| Location | Authority |
|---|---|
| `docs/product` | Intended gameplay, domain rules, interface behavior and authored balance |
| `docs/milestones` | Delivery outcomes, dependencies, acceptance criteria, proposed PR sequence and actual progress |
| `.cursor/plans` | Temporary implementation plan for the assigned PR, grounded in current code |
| Workspace guidance, source and tests | Current implementation and repository standards |

Use [initiative-workflow](../../.cursor/skills/initiative-workflow/SKILL.md) as the single orchestration procedure. This guide supplies milestone policy; it does not introduce a competing build/review/PR pipeline. Link product rules rather than rewriting them into every milestone or PR plan.

## Agreed milestone sequence

These ten documents define delivery outcomes, proposed PR slices and acceptance scenarios. All implementation is currently planned; authoring a milestone does not complete it. PR breakdowns are refined against current code before execution.

| Order | Milestone | Intended boundary |
|---|---|---|
| 1 | [Final architecture and mathematical model](engine-architecture-and-mathematics.md) | Whole-engine responsibilities, resource/work equations and tick ordering, supported by independent numerical reference tests, not prose alone |
| 2 | [Entities and catalogs](entities-and-catalogs.md) | Project/service/instance/asset ownership, indexed identities, dependencies and validated isolated catalogs |
| 3 | [Demand, work retention and learning foundations](demand-and-learning-foundations.md) | Demand batches, queues and age/progress; two-slot research/course lifecycle, tuition and completion effects recorded for later integration |
| 4 | [Infrastructure preparation and operations](infrastructure-preparation-and-operations.md) | Installation, configuration, operational queue and readiness; prepare transfer lifecycle without claiming resource-dependent transfer complete |
| 5 | [Resource allocation and system execution](resource-allocation-and-execution.md) | Fair shared-resource execution, full-path outcomes, queues and actual resource-consuming transfers |
| 6 | [Contracts, economy and business growth](contracts-economy-and-growth.md) | Obligations, settlement, customer relationships, financial recovery and incoming opportunities |
| 7 | [Observation, incidents and recovery](observation-incidents-and-recovery.md) | Coverage-aware history, diagnosis, attribution, repair, backups and checkpoints |
| 8 | [Routing and automation](routing-and-automation.md) | Balancers, health checks, replication/failover, replacements and automatic leasing |
| 9 | [Complete learning and catalog coverage](learning-and-technology-coverage.md) | Complete capability behaviors and skill/research integration; not a holding area for prerequisites needed earlier |
| 10 | [Interface completion and game validation](interface-and-game-validation.md) | Finish integrated desktop/mobile flows and validate extended gameplay, balance and performance |

This sequence supersedes the earlier broad transition plan's ordering. Preparation precedes the complete resource solver. Define the mathematical contracts early; complete transfers only when actual allocation exists. Across milestones 3–5, exercise interactive, queued, continuous and finite computational work, including GPU compatibility, using representative workloads.

## Earlier commercial playtest

Keep the architecture-first dependency order, but deliver a representative commercial path before expanding every catalog branch. This is an integration checkpoint, not a second engine, a new product mode or a fixed six-to-eight-PR promise.

- Milestone 3 supplies the shared ledger boundary and a usable research enrollment, including Monitoring research.
- Milestone 4 brings forward the acquaintance offer, contract details, acceptance advance and setup-cancellation policy from milestone 6. The player buys or leases a host, installs the application/database, configures the connection and explicitly starts the ready project. Activation establishes the real billing origin.
- Milestone 5 connects actual demand and execution to that contract's weekly settlement, hourly tenure costs, credits and debt recovery. At its exit, play the appointment project through acceptance, setup, service and the first renewal. Test an affordable strategy and a deliberately overloaded strategy. Include the existing full resource accounting; do not invent a CPU/RAM-only fallback.
- Milestone 6 generalizes that proven contract path to the version-one workload families, customer relationships and offer growth, without rewriting its ledger or activation logic.
- Milestone 7 delivers Monitoring, one diagnosable incident and repair first, then performs a second playtest before completing broader recovery coverage. A seeded/injected incident may support verification; it must not become a guaranteed scripted opening event.

The milestone 5 session assesses whether time, rent/buy, capacity and settlement make understandable decisions. The milestone 7 session adds uncertainty, paid monitoring and recovery. Record confusion, dominant strategies, idle waiting and cash-pressure findings before widening coverage; policy tuning stays in catalogs. Their success is evidence to continue, not a promise that the game is already balanced. Failed sessions trigger targeted revisions to the relevant slices, not automatic scope expansion.

Version-one completion covers only `release: "v1"` entries in the [catalog](../product/technology-catalog.md#version-one-scope). Expansion entries and their projects are not release gates. A repeatable baseline validator with release-closure checks belongs in the first milestone's foundation work.

## Development constraints

Change the existing engine directly. There is no live legacy game to preserve and no requirement for parallel engines, compatibility layers or old-save migration. Each PR keeps the application runnable and passes its applicable checks; all gameplay flows need not be complete at every intermediate step. State incomplete behavior explicitly rather than faking success.

Architecture and mathematics determine dependency order. Prepare missing foundations before their consumers rather than adding disposable calculations to make a screen appear functional. Keep tunables in the catalog/policy boundary.

The user supplied the Figma desktop/mobile design on 2026-09-10 and approved its shell/workspace layout. Preserve its generated source in [the reference application](../../apps/figma-design/README.md); it is visual reference material, not production architecture. Each milestone’s interface integration and acceptance criteria define the required production flows, following the [interface brief](../product/interface-design-brief.md) and [interaction specification](../product/interaction-specification.md). Missing controls do not defer capabilities or mark them delivered. Implement the corresponding final UI in the real application alongside each capability, preserving shared React Native components. Do not schedule a temporary UI or postpone all UI integration to milestone 10. Lab is a lightweight diagnostic aid, with no separate milestone or duplicate full management interface.

Employees, away-time simulation and server/Nest/SSE migration remain deferred. Login and eventual server authority remain agreed product rules.

## Milestone coordination and PR execution

A milestone is the coordination unit; a PR is the usual execution unit. The coordinator owns the overall outcome, dependency map, initial PR breakdown and final integration checks. The assigned PR implementer owns current-code inspection, its detailed plan, implementation, verification and documentation synchronization.

These are responsibilities, not a mandatory number of agents. The same agent may continue into a directly related PR after refreshing merged state. Use a fresh agent when the domain changes or context becomes unwieldy. Run independent work concurrently only when useful and authorized by the active task's delegation rules; never assume one new agent per PR or automatically spawn a coordinator team.

An assignment should name the milestone and intended PR outcome. Agents then read the linked context themselves. Do not require the user to paste the whole product discussion, select every coefficient or repeat workflow instructions.

## PR sizing and planning

Aim for roughly 20–30 changed files and 2,000–3,000 total added/deleted lines or less when practical. These are reviewability guidelines, not hard caps or minimum targets. A cohesive slightly larger change can be better than an artificial split. Generated output, removals and behavioral complexity deserve separate explanation; do not hide them from the count.

Milestone PR breakdowns are provisional. Inspect current code and merged predecessors before writing each PR's `.cursor/plans/<slug>.plan.md`. Define scope, interfaces, touched surfaces, implementation steps, tests, documentation impact and exclusions. Reference approved equations instead of redesigning them. Simple low-impact changes may use a concise task plan rather than a ceremonial file.

Agents may split, combine or reorder dependent implementation details within the agreed outcome, recording the reason in the milestone. Ask the user only for material product behavior, scope or delivery-priority changes, or a genuine unresolved conflict. Existing authorization persists; do not ask for routine approval at every pipeline step. Creating these documents does not itself authorize implementing the whole roadmap or merging PRs.

## Execution and completion

1. Read the milestone, relevant product sources, workspace guidance and latest predecessor/main changes.
2. Confirm the assigned slice's dependencies exist. Create or refine its PR plan through planning-workflow.
3. Execute through builder-workflow and pass relevant verification. For mathematical foundations, acceptance includes numerical cases and invariant tests; it does not require a finished visual interface.
4. Run documentation-sync on the actual change; update the milestone's delivery record and any durable decisions in their proper reference.
5. Use git-pr-workflow when commit/push/PR creation is authorized. Follow the existing quality gate and review rules.
6. Record the actual PR link and state. An opened PR is not merged; verified local work is not proof of CI or merge. Confirm merge before declaring a prerequisite delivered.
7. Assess the milestone's complete acceptance criteria after its constituent PRs merge. Individual passing PRs alone do not establish cross-feature correctness.

Keep a compact delivery table in each milestone: PR slice, dependency, outcome, status, PR link and verification evidence. Suggested states: planned, in progress, in review, merged, blocked. Explain actual blockers; do not create another perpetual documentation-review queue.

Before deleting a completed PR plan, preserve any durable decision and necessary evidence in the milestone/product/technical reference, and repair inbound links. Retire the temporary plan in a subsequent cleanup change after merge. Milestones retain the PR history and result; do not retain obsolete plans merely as duplicate records.

## Required shape of a milestone document

- Outcome and boundaries, with product references.
- Prerequisite milestones and technical foundations.
- Acceptance criteria and concrete verification scenarios.
- Proposed PR slices, dependencies and rationale for their size.
- Relevant design screens and timing of UI integration.
- Delivery record with actual links, status and evidence.
- Only material unresolved decisions; delegated implementation choices stay with the agent.

## Verification gates

For an engine slice, run in order:

```bash
bun test packages/fivenines-engine
bun run turbo run typecheck --filter=@packages/fivenines-engine
bun run overall
```

For UI changes, run affected workspace tests under their nested guidance, verify the relevant desktop/mobile journeys and keyboard/touch states, then run `bun run overall`. Select graph/chart dependencies against the actual shared React Native stack; prototype dependencies are not automatically production choices.

If a gate cannot start, repair the environment and rerun it. Record limitations honestly; document/link checks are not substitutes for runtime tests. Reference numerical fixtures establish equations, seeded scenarios establish integration behavior, and manual play sessions establish usability evidence. None substitutes for the others.

# Repository boundaries

This is a short map of the repository's essential responsibilities, checked against workspace guidance on 2026-09-09. Follow the linked `AGENTS.md` for implementation details. This page does not replace those rules or the code-review rubric.

## Applications

| Workspace | Responsibility | Essential boundary |
|---|---|---|
| [@apps/web](../../apps/web/AGENTS.md) | Player UI, public website, and browser debug harness | TanStack Start static SPA; no Start server functions or second backend. Hub and Lab currently construct Game locally; existing clock SSE is not simulation time. |
| [@apps/nestjs](../../apps/nestjs/AGENTS.md) | Existing API/control plane and eventual game session transport | Keep simulation rules in the engine. Existing feature-flag Tenant/Project records are not game entities; further feature-flag development is cancelled. Game session migration is deferred. |
| [@apps/auth](../../apps/auth/AGENTS.md) | Login, sessions, JWT/refresh, and machine authentication | Auth logic belongs in its service layer; pages do not directly access Prisma. Preserve the existing redirect and token contracts. |

Native mobile is an intended next application, not an existing workspace created by this documentation. Current shared React Native components do not imply that every web page or hook is already portable.

## Shared packages

| Workspace | Responsibility | Essential boundary |
|---|---|---|
| [@packages/fivenines-engine](../../packages/fivenines-engine/AGENTS.md) | Simulation time, demand, capacity, money, SLA, and billing | Commands and ticks are distinct. No React, Nest, or database authority inside simulation rules. Numeric boundaries and tunables follow engine policy files. |
| [@packages/ui](../../packages/ui/AGENTS.md) | React Native/RNR atoms, display components, theme, Storybook | Components take display data and callbacks; no engine or auth imports. Web adapters stay at the appropriate UI boundary. |
| [@packages/shared](../../packages/shared/AGENTS.md) | General utilities, validation helpers, and display formatting | No engine/product types; formatters do not calculate gameplay outcomes. |
| [@packages/shared-react](../../packages/shared-react/AGENTS.md) | Small reusable React hooks | Keep generic hooks separate from game orchestration; browser-specific hooks need platform consideration. |
| [@packages/shared-tanstack](../../packages/shared-tanstack/AGENTS.md) | TanStack list, query, form, and virtualization helpers | Consumers provide the required framework context; helpers do not own simulation state. |
| [@packages/auth](../../packages/auth/AGENTS.md) | Shared auth contract, session handling, and React integration | Authentication plumbing is distinct from game state and generic HTTP transport. |
| [@packages/analytics](../../packages/analytics/AGENTS.md) | Browser consent and Google Tag Manager | Production configuration and analytics consent gate GTM; no Firebase/FCM. Web owns consent static assets. |
| [@packages/http](../../packages/http/AGENTS.md) | Browser, request-scoped server, and static HTTP clients | Avoid shared request-specific server state; use the bare client for refresh to prevent recursion. |
| [@packages/nestjs-sdk](../../packages/nestjs-sdk/AGENTS.md) | Orval client generated from Nest OpenAPI | Regenerate clients from API definitions; do not hand-edit generated code. |

Links above are relative to this product directory; the workspace documents own detailed rules. If technical guides disagree, inspect their code and specific current contract instead of copying conflicting instructions into product documents.

## Tooling

| Workspace | Responsibility | Rule |
|---|---|---|
| @tools/scripts | Repository CLIs and quality orchestration | Use the established commands; see [Scripting](../SCRIPTING.md). |
| [@tools/typescript](../../tools/typescript/AGENTS.md) | Shared TypeScript presets | Keep strictness and shared configuration consistent. |
| [@tools/tests-preset](../../tools/tests-preset/AGENTS.md) | Shared test environment and helpers | Keep test setup reusable and isolate state between tests. |

## Rules that cross boundaries

- All balance-changing catalogs, coefficients, factors, and policies remain isolated from simulation behavior in the engine's `src/catalog/` directory, following the existing convention. The authored numeric specification lives in [Balance](balance/index.md) until runtime implementation. Game, Server, demand generation, UI, and transport must consume configuration rather than embed tuning literals.

- Read the root and relevant nested `AGENTS.md` before editing. Use workspace package names in filters and scopes.
- The engine determines outcomes. UI displays them; a future server hosts the same engine rather than reimplementing its formulas.
- Frontend engine execution currently supports engine development. The target uses authoritative server state and SSE updates; device-side game storage holds a snapshot and unsent player commands. Login is required for gameplay, and server migration remains deferred.
- Preserve the distinction between simulated resources in the game and real infrastructure running the repository.
- Keep repository text and application copy in English, using recognizable real-world terminology.
- Keep secrets out of source control. Preserve established auth boundaries and generated-file ownership.
- Run the required quality gate before committing; the default is `bun run overall`. Command details live in [Cheatsheet](../CHEATSHEET.md).
- Product documents define intent. Technical plans define implementation slices. Workspace rules define code boundaries. The wiki is not the source of kernel formulas.

See [root AGENTS.md](../../AGENTS.md) and the [review rubric](../../.github/copilot-instructions.md) for the authoritative repository map and review process.

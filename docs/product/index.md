# Five Nines product documentation

Five Nines is a management game about building an infrastructure and operations business. This directory explains the intended product, the player's responsibilities, and the concepts behind its systems.

## Reading guide

For the approved visual direction, start with the preserved [Figma design reference](../../apps/figma-design/README.md), [interface brief](interface-design-brief.md), and [interaction specification](interaction-specification.md). The [Figma Make handoff](figma-make-handoff.md) remains extension guidance and a coverage checklist. Missing prototype interactions remain implementation work, not automatic product deferrals.

| Document | Question it answers |
|---|---|
| [Introduction](introduction.md) | What is the game, and why would someone play it? |
| [Gameplay](gameplay.md) | What does the player do, and how does the business grow? |
| [Domain model](domain-model.md) | What exists in the game, who owns it, and how is it connected? |
| [Technology catalog](technology-catalog.md) | Which proposed technologies support project features, and what research and runtime dependencies do they have? |
| [Balance baseline](balance/index.md) | What authored catalog entries, policy numbers, and validation evidence support the next engine design? |
| [Product direction](product-direction.md) | What changes next, what can be reused, and what stays independent? |
| [Interface design brief](interface-design-brief.md) | Which UI constraints are agreed, which layouts are proposed, and what should a Figma Make handoff cover? |
| [Infrastructure editor](infrastructure-editor.md) | How do Requirements, placement, proposed changes and automatic setup work? |
| [Interaction specification](interaction-specification.md) | Which actions belong to each infrastructure object, how are they prioritized, and what states and impact reviews must the design cover? |
| [Repository boundaries](repository-boundaries.md) | Which application or package owns each technical responsibility? |
| [Open questions](open-questions.md) | Which implementation, verification, and deferred work remains? |

## How to use these documents

The agreed direction comes from the product discussion recorded on 2026-09-09. Proposed mechanics and unresolved choices are labeled explicitly. The domain model is a design vocabulary, not a statement that matching classes or database tables already exist.

`docs/product` is the reference for intended product behavior. `.cursor/plans` contains technical implementation plans and historical engineering records. Code, tests, and workspace `AGENTS.md` files describe current implementation. A product decision changes the target; it does not silently change the running game or authorize a broad rewrite.

The public wiki can explain the game to players. It does not replace this product reference or the engine's technical rules. Future milestones should link to these documents rather than duplicate their definitions.

## Writing rules

- Write documents, code comments, identifiers, and application copy in English. Use kebab-case filenames without sequence numbers.
- Prefer established terms such as customer, workload, deployment, database, and reputation. Avoid vocabulary that depends on private conversation context.
- Record each decision in its relevant document; keep unresolved choices in [Open questions](open-questions.md).
- Describe observable player behavior before implementation details. Keep formulas, exact catalog prices, endpoint lists, and development commands in their technical sources.
- Do not turn illustrative values, scenarios, or proposed mechanics into committed requirements without a design decision. Delegated baseline values are working defaults; visual fixtures are not new catalog entries.

## Source precedence

Gameplay owns behavioral rules; Domain model owns vocabulary and relationships. The interface brief and interaction specification own approved presentation and action hierarchy. The balance JSON owns authored numeric defaults, with companion documents explaining their interpretation. Historical plans and source UI screenshots cannot override those targets. Code and workspace guidance describe current implementation, not proof that the target is already delivered.

When a genuine contradiction remains, identify it explicitly before implementing dependent behavior. Do not choose whichever document was encountered last. The approved prototype is the visual reference; its fixture values, inactive modules and incomplete callbacks do not override gameplay, domain or balance rules. Its imported prompts are historical inputs, not current repository instructions. Reconciled presentation decisions belong in the interface documents; the handoff and prototype do not become a second behavioral authority.

# AGENTS.md

Guidance for **@packages/shared-react** — small React hooks shared across packages.

## Commands

```bash
bun run typecheck --filter=@packages/shared-react
bun test packages/shared-react
```

## Exports

| Import | Role |
|--------|------|
| `@packages/shared-react` | Barrel (`useDebouncedCallback`, `useVisibilityChange`) |
| `@packages/shared-react/useDebouncedCallback` | Debounced callback hook |
| `@packages/shared-react/useVisibilityChange` | `document.visibilitychange` listener |

## Usage

```typescript
import { useDebouncedCallback } from "@packages/shared-react/useDebouncedCallback";
import { useVisibilityChange } from "@packages/shared-react/useVisibilityChange";

const debouncedSave = useDebouncedCallback(() => save(), [save], 300);
useVisibilityChange((hidden) => pause(hidden), [pause]);
```

Peer dependency: `react` ^19.

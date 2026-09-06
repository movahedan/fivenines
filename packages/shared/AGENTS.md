# AGENTS.md

Guidance for `@packages/shared`. Repo map: [root AGENTS.md](../../AGENTS.md). Commands: [CHEATSHEET](../../docs/CHEATSHEET.md).

## Role

Cross-app helpers that are not UI-specific: logging, cookies, and integer units.

CSS class merging lives in `@packages/ui/utils` (`cn`).

## Commands

| Command | What |
|---------|------|
| `bun run typecheck` | `tsc --noEmit` |
| `bun test packages/shared` | Unit tests |

## Exports

```typescript
import { log } from "@packages/shared/logger";
import { cookies } from "@packages/shared/cookies";
import { units } from "@packages/shared/units";
```

`cookies.get(name)` reads `document.cookie`. Pass `req.headers` (or a raw `Cookie` header string) to parse the request instead.

`cookies.set(name, value, flags, headers?)` serializes flags. When `headers` is passed, it clones them, appends `Set-Cookie`, and returns the clone. When omitted, it writes `document.cookie`. `cookies.delete` is `set` with an empty value and `Max-Age=0`.

`units` validates finite integers. Ratios floor their result and return `0` for a zero denominator.

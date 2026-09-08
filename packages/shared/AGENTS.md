# AGENTS.md

Guidance for `@packages/shared`. Repo map: [root AGENTS.md](../../AGENTS.md). Commands: [CHEATSHEET](../../docs/CHEATSHEET.md).

## Role

Cross-app helpers that are not UI-specific: logging, cookies, integer units, id uniqueness, and display formatters (cents, `TICK`/`DAY · HR` clock, ppm as percent, cores). No product/engine types.

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
import { ids } from "@packages/shared/ids";
import { formatters } from "@packages/shared/formatters";
```

`cookies.get(name)` reads `document.cookie`. Pass `req.headers` (or a raw `Cookie` header string) to parse the request instead.

`cookies.set(name, value, flags, headers?)` serializes flags. When `headers` is passed, it clones them, appends `Set-Cookie`, and returns the clone. When omitted, it writes `document.cookie`. `cookies.delete` is `set` with an empty value and `Max-Age=0`.

`units` validates finite integers. Ratios floor their result and return `0` for a zero denominator.

`ids.assertUnique(values, label)` throws `duplicate ${label} id: …` when a string appears twice.

`formatters` is display-only (`cents`, `hourTick` → `TICK 0000`, `clockLabel` → `DAY 01 · HR 00:00` with 1-based day, `ppm` → `99.00%` from integer ppm/10_000, `cores` / `coresCompact`). Kernel values stay integers; these functions only shape strings. It must not import engine, auth, or UI.

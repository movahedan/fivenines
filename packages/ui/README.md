# @packages/ui

Shared React UI for Fivenines: **React Native Reusables** atoms (NativeWind v5) plus molecule wrappers. Legacy web shadcn lives under `src/shadcn` and stays exported.

## Install

Workspace dependency: `"@packages/ui": "workspace:*"`.

## Imports

```ts
import { Button } from "@packages/ui/molecules";
import { Button as AtomButton } from "@packages/ui/atoms";
import "@packages/ui/style.css";
```

Archived DOM shadcn:

```ts
import { Button } from "@packages/ui/shadcn";
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run turbo run dev --filter=@packages/ui` | Storybook on port **3004** |
| `bun run turbo run build:storybook --filter=@packages/ui` | Static build |
| `bun run typecheck` | Types |
| `bun test packages/ui` | Tests |

Details for agents: [AGENTS.md](AGENTS.md). Storybook: [STORYBOOK.md](STORYBOOK.md).
